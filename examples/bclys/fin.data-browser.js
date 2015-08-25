com= {};com.groupingView= {};com.dataProviders= {};
com.groupingView.ViewModel = (function (_super) {

    function ViewModel(groups, visibleRows, visibleColumns) {

        this.hScrollIndex = 0;
        this.vScrollIndex = 0;
        this.visibleColumns = visibleColumns;
        this.visibleRows = visibleRows;
        this.groups = groups;
    }

    return ViewModel;
})();
com.AggregationFunctions = {

    sum: (function(){

        function sum(){

            this.value = 0;
        }

        sum.prototype.method = function(value){

            this.value += Number(value);
        };

        sum.prototype.post = function(){

            return this.value;
        };

        return sum;

    })(),

    avg: (function(){

        function avg(){

            this.value = 0;
            this.count = 0;
        }

        avg.prototype.method = function(value){

            this.value += Number(value);
            ++ this.count;
        };

        avg.prototype.post = function(){

            return this.value / this.count;
        };

        return avg;
    })(),

    min: (function(){

        function min(){

            this.value = null;
        }

        min.prototype.method = function(value){

            value = Number(value);
            if(this.value === null || value < this.value ) {

                this.value = value;
            }
        };

        min.prototype.post = function(){

            return this.value;
        };

        return min;
    })(),

    max: (function(){

        function max(){

            this.value = null;
        }

        max.prototype.method = function(value){

            value = Number(value);
            if(this.value === null || value > this.value ) {

                this.value = value;
            }
        };

        max.prototype.post = function(){

            return this.value;
        };

        return max;
    })()
};com.groupingView.RowView = (function (_super) {

    var AggregationFunctions = com.AggregationFunctions;

    function RowView(group, visibleColumns) {

        this.group = group;
        this.visibleColumns = visibleColumns;
        this.groupNameColumn = null;
        this.summaryColumn = null;
        this.averageColumn = null;
        this.maxColumn = null;
        this.minColumn = null;
        this.countColumn = null;
        this.expanded = false;
        this.contractedView = this.createContractedView();
        this.expandedView = this.createExpandedView();
        this.tr = this.createRow();
        this.rows = [];
    }

   RowView.prototype.createRow = function(){

       var row = document.createElement("tr");
       row.appendChild(this.createColumn(this.createExpandButton()));
       row.appendChild(this.createColumn(this.contractedView, this.expandedView));
       return row;
   };

    RowView.prototype.createContractedView = function(){

        var table = document.createElement("table");
        var tr = document.createElement("tr");
        tr.appendChild(this.groupNameColumn = this.createColumn());
        tr.appendChild(this.summaryColumn = this.createColumn());
        tr.appendChild(this.averageColumn = this.createColumn());
        tr.appendChild(this.maxColumn = this.createColumn());
        tr.appendChild(this.minColumn = this.createColumn());
        tr.appendChild(this.countColumn = this.createColumn());
        table.appendChild(tr);

        return table;
    };

    RowView.prototype.createExpandedView = function(){

        var table = document.createElement("table");
        return table;
    };

    RowView.prototype.createColumn = function(){

        var col = document.createElement("td");
        col.style.verticalAlign = "top";
        if(arguments.length) {
            for(var i = 0; i < arguments.length; i++) {

                col.appendChild(arguments[i]);
            }
        }
        return col;
    };

    RowView.prototype.createExpandButton = function(){

        var button = document.createElement("button");
        button.innerHTML = "+";
        button.onclick = this.onExpand.bind(this);
        return button;
    };

    RowView.prototype.onExpand = function(event){

        this.expanded = !this.expanded;
        this.updateData(this.group);
        event.target.innerHTML = this.expanded? "-" : "+";
    };

    RowView.prototype.updateData = function(group){

        this.group = group;
        var aggregations = group.applyFunctionsToColumn({sum: {function: AggregationFunctions.sum, column: 2}, avg: {function: AggregationFunctions.avg, column: 2}, max: {function: AggregationFunctions.max, column: 2}, min: {function: AggregationFunctions.min, column: 2} });
        this.groupNameColumn.innerHTML = group.name;
        this.summaryColumn.innerHTML = "Sum: " + aggregations.sum.toFixed(2);
        this.averageColumn.innerHTML = "Avg: " + aggregations.avg.toFixed(2);
        this.maxColumn.innerHTML = "Max: " + aggregations.max.toFixed(2);
        this.minColumn.innerHTML = "Min: " + aggregations.min.toFixed(2);
        this.countColumn.innerHTML = "Count: " + group.getRowCount();

        if(this.expanded){

            if(group.groups){

                this.updateGroupsView(group.groups);
            } else {

                this.updateExpandedView(group);
            }

            this.expandedView.style.display = "block";
        } else {

            this.expandedView.style.display = "none";

        }
    };

    RowView.prototype.updateGroupsView = function(groups){

        var rows = this.rows;

        for(var y = 0; y < groups.length; y++) {

            var row = rows[y];
            if(!row){

                this.expandedView.appendChild(this.createGroupRow(groups[y]));
                continue;

            } else {

                row.updateData(groups[y]);
            }
        }
    };

    RowView.prototype.updateExpandedView = function(group){

        var rows = this.expandedView.getElementsByTagName("tr");

        for(var y = 0; y < group.getRowCount(); y++) {

            var tr = rows[y];
            if(!tr){

                tr = document.createElement("tr");
                this.expandedView.appendChild(this.addDataRow(group, y));
                continue;

            } else {

                var cols = tr.getElementsByTagName("td");
                for (var x = 0; x < this.visibleColumns; x++) {

                    cols[x].innerHTML = group.getValue(x, y);
                }
            }
        }
    };

    RowView.prototype.createGroupRow = function(group){

        var row =   new RowView(group, this.visibleColumns);
        row.updateData(group);
        this.rows.push(row);
        return row.tr;
    };

    RowView.prototype.addDataRow = function(group, y){

        console.log(this.visibleColumns);
        var tr = document.createElement("tr");
        for(var x = 0; x < this.visibleColumns; x++){

            var td = this.createColumn();
            td.innerHTML = group.getValue(x, y);
            tr.appendChild(td);
        }
        return tr;
    };

    return RowView;
})();com.groupingView.View = (function (_super) {

    var ViewModel = com.groupingView.ViewModel;
    var RowView = com.groupingView.RowView;

    function View(dataBrowser, table, visibleRows, visibleColumns) {

        this.viewModel = new ViewModel(dataBrowser, visibleRows, visibleColumns);
        this.table = table;
        this.rows = [];
        this.createRows();
        this.updateData();
    }

    View.prototype.createRows = function(){

        var tbody = this.table.getElementsByTagName("tbody")[0];
        var visibleRows = this.viewModel.visibleRows;

        for(var i = 0; i < visibleRows; i++){

            tbody.appendChild(this.createRow(this.viewModel.groups[i]));
        }
    };

    View.prototype.createRow = function(group){

        var row =   new RowView(group, this.viewModel.visibleColumns);
        this.rows.push(row);
        return row.tr;
    };

    View.prototype.updateData = function(){

        for(var y = 0; y < this.viewModel.visibleRows; y++){

            var row = this.rows[y].updateData(this.viewModel.groups[y + this.viewModel.vScrollIndex]);
        }
    };

    return View;
})();
com.QuickSort = function sort(array, less) {

    function swap(items, firstIndex, secondIndex){
        var temp = items[firstIndex];
        items[firstIndex] = items[secondIndex];
        items[secondIndex] = temp;
    }

    function testLess(a, b){

        var value = less(a, b);
        if(value === 0){

            return a.__sortPosition - b.__sortPosition;
        }

        return value;
    }

    function partition(items, left, right) {

        var pivot   = items[Math.floor((right + left) / 2)],
            i       = left,
            j       = right;


        while (i <= j) {

            while (testLess(items[i], pivot) < 0) {
                i++;
            }

            while (testLess(pivot, items[j]) < 0) {
                j--;
            }

            if (i <= j) {
                swap(items, i, j);
                i++;
                j--;
            }
        }

        return i;
    }

    function quickSort(items, left, right) {

        var index;

        if (items.length > 1) {

            left = typeof left != "number" ? 0 : left;
            right = typeof right != "number" ? items.length - 1 : right;

            index = partition(items, left, right);

            if (left < index - 1) {
                quickSort(items, left, index - 1);
            }

            if (index<  right) {
                quickSort(items, index, right);
            }
        }

        return items;
    }

    function addPositions(items){

        for(var i = items.length - 1; i >= 0; --i){

            var item = items[i];
            if(!item.__originalPosition) {

                item.__originalPosition = i + 1;
            }
            items.__sortPosition = i;
        }
    }

    addPositions(array);
    return quickSort(array);
};

com.QuickSort.reset = function(array){

    return com.QuickSort(array)
};com.dataProviders.JSDataProvider = (function (_super) {

    function JSDataProvider(fields, data) {

        this.fields = fields;
        this.data = data;

        console.log(this.fields);
    }

    JSDataProvider.prototype.getValue = function(x, y){

        var value = this.data[y][this.fields[x]];
        return typeof value === "function"?  value(): value;
    };

    JSDataProvider.prototype.getRow = function(y){

        return this.data[y];
    };

    JSDataProvider.prototype.setValue = function(x, y, value){

        this.data[y][this.fields[x]] = value;
    };

    JSDataProvider.prototype.getColumnCount = function(){

        return this.fields.length;
    };

    JSDataProvider.prototype.getRowCount = function(){

        return this.data.length;
    };

        JSDataProvider.prototype.sortOn = function(columnIndex, type){

        var fields = this.fields;
        type = type || 1;
        com.QuickSort(this.data, function(a, b){

            a = a[fields[columnIndex]];
            b = b[fields[columnIndex]];

            if (a === b){

                return 0;
            }

            return (a < b ? -1: 1) * type;
        });
    };

    JSDataProvider.prototype.resetSort = function(){

        com.QuickSort(this.data, function(a, b){

            a = a.__originalPosition;
            b = b.__originalPosition;

            if (a === b){

                return 0;
            }

            return a < b ? -1: 1;
        });
    };

    JSDataProvider.prototype.getFields = function(){

        return this.fields;
    };

    return JSDataProvider;
})();com.dataProviders.CSVDataProvider = (function(){

    function CSVDataProvider(data){

        this.data = this._parseData(data);
        this.totalRows = this.data.length - 1;
        this.totalColumns = this.columns.length;
    }

    CSVDataProvider.prototype._parseData = function(data) {

        var rows = data.split("\n");
        this.columns = rows[0].split(',');
        var length = rows.length - 1;

        for(var i = 0; i < length; ++i){

            rows[i] = rows[i + 1].split(",");
        }

        return rows;
    };

    CSVDataProvider.prototype.getValue = function(x, y){

        return this.data[y][x];
    };

    CSVDataProvider.prototype.setValue = function(x, y, value){

        this.data[y][x] = value;
    };

    CSVDataProvider.prototype.getColumnCount = function(){

        return this.totalColumns;
    };

    CSVDataProvider.prototype.getRowCount = function(){

        return this.totalRows;
    };

    CSVDataProvider.prototype.sortOn = function(columnIndex, type){

        type = type || 1;
        com.QuickSort(this.data, function(a, b){

            a = a[columnIndex];
            b = b[columnIndex];

            if (a === b){

                return 0;
            }

            return (a < b ? -1: 1) * type;
        });
    };

    return CSVDataProvider;
})();
com.DataGroup = (function(){

    var AggregationFunctions = com.AggregationFunctions;


    function DataGroup(name, dataProvider){

        this.name = name;
        this.rowIndexes = [];
        this.dataProvider = dataProvider;
    }

    DataGroup.prototype.name = null;
    DataGroup.prototype.rowIndexes = null;
    DataGroup.prototype.dataProvider = null;

    DataGroup.prototype.getValue = function(x, y){

        return this.dataProvider.getValue(x, this.rowIndexes[y]);
    };

    DataGroup.prototype.setValue = function(x, y, value){

        return this.dataProvider.setValue(x, this.rowIndexes[y], value);
    };

    DataGroup.prototype.getRowCount = function(){

        return this.rowIndexes.length;
    };

    DataGroup.prototype.getColumnCount = function(){

        return this.dataProvider.totalColumns;
    };


    DataGroup.prototype.getGroup = function(columnIndex){

        var groupsByName = {}, groups = [];
        var dataProvider = this.dataProvider;
        var length = this.getRowCount();
        var group = null;

        for(var i = 0; i < length; i++){

            var columnValue = this.getValue(columnIndex, i);
            if(!groupsByName[columnValue]){

                group = new DataGroup(columnValue, dataProvider);
                groupsByName[columnValue] = group;
                groups.push(group);

            } else {

                group = groupsByName[columnValue];
            }

            group.rowIndexes.push(this.rowIndexes[i]);
        }

        return groups;
    };


    DataGroup.prototype.applyFunctionsToColumn = function(customFunctions){

        var length = this.getRowCount();
        var values = {};
        for(var name in customFunctions){

            var current = customFunctions[name];
            current.instance = new current.function();
        }

        for(var i = 0; i < length; i++){

            for(var name in customFunctions){

                var current = customFunctions[name];
                current.instance.method(this.getValue(current.column, i));
            }
        }

        for(var name in customFunctions){

            values[name] = customFunctions[name].instance.post();
        }

        return values;
    };

    DataGroup.prototype.getSum = function(columnIndex){

        var obj = this.applyFunctionsToColumn({sum: {function: AggregationFunctions.sum, column: columnIndex}});
        return obj.sum;
    };

    DataGroup.prototype.getFirst = function(columnIndex){

        var obj = this.applyFunctionsToColumn({first: {function: AggregationFunctions.first, column: columnIndex}});
        return obj.first;
    };

    return DataGroup;
})();



com.DataBrowser = (function(){


    function DataBrowser(dataProvider){

        this.dataProvider = dataProvider;
        this.filteredData = null;
        this.groups = null;
    }

    DataBrowser.prototype.getGroup = function(columnIndex){

        var groupsByName = {}, groups = [];
        var dataProvider = this.dataProvider;
        var length = dataProvider.getRowCount();
        var group = null;

        for(var i = 0; i < length; i++){

            var columnValue = dataProvider.getValue(columnIndex, i);
            if(!groupsByName[columnValue]){

                group = new com.DataGroup(columnValue, dataProvider);
                groupsByName[columnValue] = group;
                groups.push(group);

            } else {

                group = groupsByName[columnValue];
            }

            group.rowIndexes.push(i);
        }

        return groups;
    };

    DataBrowser.prototype.getRowCount = function(){

        if(this.filteredData){

            return this.filteredData.length;
        }

        return this.dataProvider.getRowCount();
    };

    DataBrowser.prototype.getColumnCount = function(){

        return this.dataProvider.getColumnCount();
    };

    DataBrowser.prototype.getValue = function(x, y){

        if(this.groups){

            var group = this.groups[y];
            var first = group.getValue(x, 0);
            if(isNaN(Number(first))){

                return first
            } else {

                return group.getSum(x);
            }

        } else if(this.filteredData){

            return this.dataProvider.getValue(x, this.filteredData[y]);
        }

        return this.dataProvider.getValue(x, y);
    };

    DataBrowser.prototype.setValue = function(x, y, value){

       if(this.filteredData){

            return this.dataProvider.setValue(x, this.filteredData[y], value);
        } else {

            this.dataProvider.setValue(x, y, value);
        }
    };

    DataBrowser.prototype.applyFunctionsToColumn = function(customFunctions){

        return com.DataGroup.prototype.applyFunctionsToColumn.apply(this, arguments);
    };

        DataBrowser.prototype.setFilters = function(filters){

        if(!filters){

            this.filteredData = null;
            return;
        }

        var dataProvider = this.dataProvider;
        var length = dataProvider.getRowCount();
        var filteredData = [];

        for(var i = 0; i < length; i++){

            if(this._applyFilters(filters, i)) {

                filteredData.push(i);
            }
        }

        this.filteredData = filteredData;
    };

    DataBrowser.prototype._applyFilters = function(filters, y){

        for(var filter in filters){

            if(!filters[filter](this.dataProvider.getValue(filter, y))){

                return false;
            }
        }

        return true;
    };

    DataBrowser.prototype.sortOn = function(columnIndex, type){

        this.dataProvider.sortOn(columnIndex, type);
    };

    DataBrowser.prototype.resetSort = function(){

        this.dataProvider.resetSort();
    };

        DataBrowser.prototype.setGroups = function(columnIndexes){

        this.groups = this.getGroup(columnIndexes[0]);
    };

        DataBrowser.prototype.setGroups = function(){

        var groups = this.getGroup(arguments[0]);
        this._applyGrouping(groups, arguments, 1);
        return groups;
    };

    DataBrowser.prototype._applyGrouping = function(groups, groupingIndexes, currentIndex){

        if(currentIndex >= groupingIndexes.length) return;

        var index = groupingIndexes[currentIndex];

        for(var i = 0; i < groups.length; i++){

            var currentGroup = groups[i];
            currentGroup.groups = currentGroup.getGroup(index);
            this._applyGrouping(currentGroup.groups, groupingIndexes, currentIndex + 1);
        }
    };

    DataBrowser.prototype.getFields = function(){

        return this.dataProvider.getFields();
    };

    return DataBrowser;
})();


com.DataBrowser;
com.AggregationFunctions;
com.dataProviders.CSVDataProvider;
com.dataProviders.JSDataProvider;
com.groupingView.View;
com.groupingView.ViewModel;
com.groupingView.RowView;
