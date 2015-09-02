(function() {

    var overlaps = function(run1, run2) {
        if (run2[0] >= run1[0] && run2[0] <= run1[1]) {
            return true;
        }
        if (run2[1] >= run1[0] && run2[1] <= run1[1]) {
            return true;
        }
        if (run1[0] >= run2[0] && run1[0] <= run2[1]) {
            return true;
        }
        if (run1[1] >= run2[0] && run1[1] <= run2[1]) {
            return true;
        }
        return false;
    };

    var subtract = function(run, each) {

        var r0 = run[0];
        var r1 = run[1];
        var e0 = each[0];
        var e1 = each[1];

        //infront return 1 smaller each
        if (r0 <= e0 && e0 <= r1 && r1 <= e1 && !(r0 === r1 && e0 === e1)) {
            return [[r1 + 1, e1]];
        }

        //inback return 1 smaller each
        if (e0 <= r0 && e0 <= r1 && e1 <= r1 && !(r0 === r1 && e0 === e1)) {
            return [[e0, r0 - 1]];
        }

        //completely inside return 2 smaller pieces from the hole
        if (e0 <= r0 && r1 <= e1 && !(e0 === r0 && e1 === r1)) {
            return [[e0, r0 - 1],[r1 + 1, e1]];
        }

        //completely outside return no pieces - no test needed
        return [];
    };

    var merge = function(run1, run2) {
        var min = Math.min(Math.min(Math.min(run1[0],run2[0]),run1[1]),run2[1]);
        var max = Math.max(Math.max(Math.max(run1[0],run2[0]),run1[1]),run2[1]);
        return [min, max];
    };

    var extract = function(data, run) {
        var result = [];
        for (var i = 0; i < data.length; i++) {
            var each = data[i];
            if(overlaps(each, run)) {
                pieces = subtract(run, each);
                result = result.concat(pieces);
            } else {
                result.push(each);
            }

        }
        return result;
    };

    var coalesce = function(data, run) {
        var result = [];
        for (var i = 0; i < data.length; i++) {
            var each = data[i];
            if(overlaps(each, run)) {
                run = merge(each, run);
            } else {
                result.push(each)
            }
        }
        result.push(run);
        return result;
    };

    function RangeSelectionModel() {
        this.data = [];
    }

    RangeSelectionModel.prototype.select = function(start, stop) {
        var min = Math.min(start, stop);
        var max = Math.max(start, stop);
        this.data = coalesce(this.data, [min, max]);
    };

    RangeSelectionModel.prototype.deselect = function(start, stop) {
        var min = Math.min(start, stop);
        var max = Math.max(start, stop);
        this.data = extract(this.data, [min, max]);
    };

    RangeSelectionModel.prototype.isSelected = function(index) {
        var data = this.data;
        for (var i = 0; i < data.length; i++) {
            var each = data[i];
            if(index >= each[0] && index <= each[1]) {
              return true;
            }
        }
        return false;
    };

    RangeSelectionModel.prototype.clear = function() {
        this.data.length = 0;
    };

    window.RangeSelectionModel = RangeSelectionModel;

})();
















