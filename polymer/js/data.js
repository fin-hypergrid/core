'use strict';

var noop = function() {};

window.flashSort = function(a, property) {
    var strVar = '(function(a) { ';
    strVar += '        var n = a.length;';
    strVar += '';
    strVar += '        var i = 0, j = 0, k = 0, t;';
    strVar += '        var m = ~~( n * 0.125 );';
    strVar += '        var a_nmin = a[0];';
    strVar += '        var nmax = 0;';
    strVar += '        var nmove = 0;';
    strVar += '';
    strVar += '        var l = new Array(m);';
    strVar += '        for ( i = 0; i < m; i++ ) {';
    strVar += '            l[ i ] = 0;';
    strVar += '        }';
    strVar += '';
    strVar += '        for ( i = 1; i < n; ++i ) {';
    strVar += '            var a_i = a[ i ];';
    strVar += '            if ( a_i.' + property + ' < a_nmin.' + property + ' ) { a_nmin = a_i; }';
    strVar += '            if ( a_i.' + property + ' > a[ nmax ].' + property + ' ) { nmax = i; }';
    strVar += '        }';
    strVar += '';
    strVar += '        var a_nmax = a[ nmax ];';
    strVar += '        if ( a_nmin.' + property + ' === a_nmax.' + property + ') { return a; }';
    strVar += '        var c1 = ( m - 1 ) \/ ( a_nmax.' + property + ' - a_nmin.' + property + ' );';
    strVar += '';
    strVar += '        for ( i = 0; i < n; ++i ) {';
    strVar += '            ++l[ ~~( c1 * ( a[ i ].' + property + ' - a_nmin.' + property + ' ) ) ];';
    strVar += '        }';
    strVar += '';
    strVar += '        for ( k = 1; k < m; ++k ) {';
    strVar += '            l[ k ] += l[ k - 1 ];';
    strVar += '        }';
    strVar += '';
    strVar += '        var hold = a_nmax;';
    strVar += '        a[ nmax ] = a[ 0 ];';
    strVar += '        a[ 0 ] = hold;';
    strVar += '';
    strVar += '        var flash;';
    strVar += '        j = 0;';
    strVar += '        k = m - 1;';
    strVar += '        i = n - 1;';
    strVar += '';
    strVar += '        while ( nmove < i ) {';
    strVar += '            while ( j > ( l[ k ] - 1 ) ) {';
    strVar += '                k = ~~( c1 * ( a[ ++j ].' + property + ' - a_nmin.' + property + ' ) );';
    strVar += '            }';
    strVar += '            if (k < 0) { break; }';
    strVar += '';
    strVar += '            flash = a[ j ];';
    strVar += '';
    strVar += '            while ( j !== l[ k ] ) {';
    strVar += '                k = ~~( c1 * ( flash.' + property + ' - a_nmin.' + property + ' ) );';
    strVar += '                hold = a[ t = --l[ k ] ];';
    strVar += '                a[ t ] = flash;';
    strVar += '                flash = hold;';
    strVar += '                ++nmove;';
    strVar += '            }';
    strVar += '        }';
    strVar += '';
    strVar += '        for( j = 1; j < n; ++j ) {';
    strVar += '            hold = a[ j ];';
    strVar += '            i = j - 1;';
    strVar += '            while( i >= 0 && a[i].' + property + ' > hold.' + property + ' ) {';
    strVar += '                a[ i + 1 ] = a[ i-- ];';
    strVar += '            }';
    strVar += '            a[ i + 1 ] = hold;';
    strVar += '        }';
    strVar += '';
    strVar += '        return a; })';
    var sortFunction = eval(strVar); /* jshint ignore:line  */
    sortFunction(a);
};

window.dualPivotQuickSort = (function() {

    var dualPivotQS = {};

    dualPivotQS.sort = function(arr, property, fromIndex, toIndex) {
        if (fromIndex === undefined && toIndex === undefined) {
            dualPivotQS.sort(arr, property, 0, arr.length);
        } else {
            rangeCheck(arr.length, fromIndex, toIndex);
            dualPivotQuicksort(property, arr, fromIndex, toIndex - 1, 3);
        }
        return arr;
    };

    function rangeCheck(length, fromIndex, toIndex) {
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

    function swap(arr, i, j) {
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    function dualPivotQuicksort(property, arr, left, right, div) {
        var len = right - left;

        if (len < 27) { // insertion sort for tiny array
            for (var i = left + 1; i <= right; i++) {
                for (var j = i; j > left && arr[j][property] < arr[j - 1][property]; j--) {
                    swap(arr, j, j - 1);
                }
            }
            return;
        }
        var third = Math.floor(len / div); //TODO: check if we need to round up or down or just nearest

        // "medians"
        var m1 = left + third;
        var m2 = right - third;

        if (m1 <= left) {
            m1 = left + 1;
        }
        if (m2 >= right) {
            m2 = right - 1;
        }
        if (arr[m1][property] < arr[m2][property]) {
            swap(arr, m1, left);
            swap(arr, m2, right);
        } else {
            swap(arr, m1, right);
            swap(arr, m2, left);
        }
        // pivots
        var pivot1 = arr[left];
        var pivot2 = arr[right];

        //their values
        var pivot1Val = pivot1[property];
        var pivot2Val = pivot2[property];

        // pointers
        var less = left + 1;
        var great = right - 1;

        // sorting
        var k = less;
        for (; k <= great; k++) {
            if (arr[k][property] < pivot1Val) {
                swap(arr, k, less++);
            } else if (arr[k][property] > pivot2Val) {
                while (k < great && arr[great][property] > pivot2Val) {
                    great--;
                }
                swap(arr, k, great--);

                if (arr[k][property] < pivot1Val) {
                    swap(arr, k, less++);
                }
            }
        }
        // swaps
        var dist = great - less;

        if (dist < 13) {
            div++;
        }
        swap(arr, less - 1, left);
        swap(arr, great + 1, right);

        // subarrays
        dualPivotQuicksort(property, arr, left, less - 2, div);
        dualPivotQuicksort(property, arr, great + 2, right, div);

        // equal elements
        if (dist > len - 13 && pivot1Val !== pivot2Val) {
            for (k = less; k <= great; k++) {
                if (arr[k][property] === pivot1Val) {
                    swap(arr, k, less++);
                } else if (arr[k][property] === pivot2Val) {
                    swap(arr, k, great--);

                    if (arr[k][property] === pivot1Val) {
                        swap(arr, k, less++);
                    }
                }
            }
        }
        // subarray
        if (pivot1Val < pivot2Val) {
            dualPivotQuicksort(property, arr, less, great, div);
        }
    }
    return dualPivotQS.sort;
}());

var SIZE = 1000;
var seed = 0;
var firstNames = ['Olivia', 'Sophia', 'Ava', 'Isabella', 'Boy', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Moe', 'Larry', 'Curly', 'Shemp', 'Groucho', 'Harpo', 'Chico', 'Zeppo', 'Stanley', 'Hardy'];
var lastNames = ['Wirts', 'Oneil', 'Smith', 'Barbarosa', 'Soprano', 'Gotti', 'Columbo', 'Luciano', 'Doerre', 'DePena'];
var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
var days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
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
    var birthyear = 1900 + Math.round(randomFunc() * 114);
    var birthmonth = Math.round(randomFunc() * 11);
    var birthday = Math.round(randomFunc() * 29);
    var birthstate = Math.round(randomFunc() * 49);
    var residencestate = Math.round(randomFunc() * 49);
    var travel = randomFunc() * 1000;
    var income = randomFunc() * 100000;
    var employed = Math.round(randomFunc());
    var person = {
        lastName: lastNames[lastName],
        firstName: firstNames[firstName],
        pets: pets,
        birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
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
    var that = this;

    return that;
};

var fa = finanalytics(data, fields);
console.log(fa);
