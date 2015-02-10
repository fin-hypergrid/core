//this is an example that connects hypergrid Q simple example to the greenplum(postgres) db airline tutorial  example (see: http://gpdb.docs.pivotal.io/gs/42/pdf/GP-Getting-Started.pdf ).  It is a simple node websocket server that loads and caches a full table in memory then dynamically serves the table blocks as hypergrid asks for them.  This js script could be enhanced to support much more including sorting, aggregation, pivot, etc.

//keep in mind because we use any-db, any other db that any-db (https://github.com/grncdr/node-any-db) currently supports(MS SQL, MySQL, Postgres, and SQLite3) can easily be setup for this demo by installing the appropriate npm driver, editing config.js, and pointing to an existing db.


var AnyDB = require('any-db');
var WSIO = require('websocket.io');
var config = require('./config.js');

console.log('creating connection to ' + config.db_url);
var conn = AnyDB.createConnection(config.db_url);
console.log('created');

var tableName = config.table;
var size = 'SELECT count(*) FROM ' + tableName;
var sql = 'SELECT * FROM ' + tableName;

var websocketPort = config.websocketPort;

//lets tell hypergrid we don't support these operations
var features = {
    sorting: false,
    columnReordering: true
  };

//this is going to hold our external rdbms table data (the cache)
var table = {
  types: {},
  headers: [],
  data: null
};

//lets map the javascript types to Q types
var typeMap = {
  string: 's',
  number: 'f'
}

var c = 0;
//lets get the row count of the target table, and then fetch the table
conn.query(size).on('data', function (result) {
  var count = parseInt(result.count);
  console.log('there are ' + count + ' rows in ' + tableName + ', loading them into memory');
  table.data = new Array(count);
  conn.query(sql).on('data', function (row) {
    if (c === 0) {
      //the first headers value is going to be the row number
      table.headers.push(['row', 'f']);
      for (var f in row) {
        //this is the meta data in Q types, only 2 here number and string
        table.headers.push([f, typeMap[typeof(row[f])]]);
      }
    }
    process.stdout.write('\rloaded ' + c + ' of ' + count + ' rows...');
    table.data[c++] = row;
    if (c === count) {
      console.log('loaded ' + count + ' rows from ' + tableName);
      launchSocketIO();
    }
  })
})

//this is equivalent to the hypergrid_support.q files fetchWindow function
var fetchWindow = function(tableName, start, num) {
  var headers = table.headers;
  num = Math.min(num, table.data.length - start);
  var result = new Array(num + 1);
  for (var r = 0; r < num; r++) {
    var row = new Array(headers.length);
    row[0] = r + start;
    for (var c = 1; c < headers.length; c++ ) {
      row[c] = table.data[r + start][headers[c][0]];
    }
    result[r] = row;
  }
  return result;
};

//this is the context for dynamic functions that can be called from the hypergrid
var handler = {
  fetchTableData: function(socket, request) {
    var data = fetchWindow(request.table,parseInt(request.start), parseInt(request.num));
    var rowCount = table.data.length;
    var headers = table.headers;
    var response = {
      data: data,
      rows: rowCount,
      headers: headers,
      features: features
    };
    socket.send(JSON.stringify(response));
  }
}

//launch the websocket server and listen for requests from the hypergrid
var launchSocketIO = function() {

  console.log('starting websocket server on ' + websocketPort);
  var io = WSIO.listen(websocketPort);
  console.log('started');

  io.on('connection', function (socket) {
    console.log('client connected');
    socket.on('message', function (x) {
      var message = JSON.parse(x);
      var cmd = message.cmd;
      var data = message.data;
      var func = handler[cmd];
      func(socket, data);
    });

    socket.on('close', function () { 
      console.log('client disconnected');
    });
  });

};



