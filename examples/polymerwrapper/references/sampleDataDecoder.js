(function(){

  var decoders = jsdialtone.namespace('decoders');
  var defaultDec = jsdialtone.namespace('decoders.default');
  var methods = jsdialtone.namespace('utilities.methods');
  var messages = jsdialtone.namespace('common.messages');
  window.sws = window.sws || {};
  var sws = window.sws;
  sws.decoders = sws.decoders || {};
  sws.decoders.sampleDataDecoder = function(){

    this.hashCode = Math.random();
    defaultDec.DefaultDataDecoder.call(this);

    this.decodeMessage = function(e){
        var serverResponse = e.eventData;
        console.log("Decode Message");
        //console.log(JSON.stringify(e.eventData));
      if(serverResponse.status === 0){
        // This request was cancelled
        console.warn('A request was cancelled.');
        return;
      }

      this.doDecodeSupplyMessage(serverResponse);
    }.bind(this);

    sws.decoders.sampleDataDecoder.prototype.doDecodeSupplyMessage = function(serverResponse){

      this.processSupply(serverResponse);

    };

    sws.decoders.sampleDataDecoder.prototype.processSupply = function(response){

      var args = new messages.EventArgs();

      console.log("Process Supply");
      //console.log(JSON.stringify(response.data));
        
      if(!response.data){
        args.name = decoders.Decoder.Events.OnError;
        args.eventData = 'No data field received in response.';
        this.emit(decoders.Decoder.Events.OnError, args);
        return;
      }
      
/*
      var data = response.data;
      if(!data.hasOwnProperty('Success')){
        args.name = decoders.Decoder.Events.OnError;
        args.eventData = 'No Success field received in data field.';
        this.emit(decoders.Decoder.Events.OnError, args);
        return;
      }

      if(data.Success !== true){
        args.name = decoders.Decoder.Events.OnError;
        args.eventData = data.FaultResponse;
        this.emit(decoders.Decoder.Events.OnError, args);
        return;
      }
*/
        // for tradestore process different format of data
      var suppliedObject;
        var columnCfg;
        if (response.data.result) {
            var suppliedRow = response.data.result.data;
            // Convert the data row to a format that jsdialtone will understand.
            var supObj = [];
            for (var g = 0; g < suppliedRow.length; g++) {
                var newrow = { title: '', field: '' };
                supObj.push(response.data.result.data[g].values);    
            }
            
            suppliedObject = supObj;
            var localcolDef = response.data.result.columns;
            columnCfg = new jsdialtone.dataObjects.DataColumnCfg();
            columnCfg.keyColumnName = 'rowKey';
            if (suppliedObject.length === 0) {
                columnCfg.columns = ['rowKey'];
            } else {
                //columnCfg.columns = Object.keys(firstRow);
                columnCfg.columns = localcolDef;
            }
            
        } else {
            suppliedObject = response.data;
            columnCfg = new jsdialtone.dataObjects.DataColumnCfg();
            columnCfg.keyColumnName = 'Id';
            if (suppliedObject.length === 0) {

                columnCfg.columns = ['Id'];
            } else {
                var firstRow = suppliedObject[0];
                columnCfg.columns = Object.keys(firstRow);
            }
        }
        
        var table = new jsdialtone.dataObjects.DataTable(columnCfg);
        table.setRows(suppliedObject);
        this.dataObject = table;
        var temp = {};
        temp.rows = suppliedObject;
        temp.columnCfg = columnCfg;
        var decodedObject = jsdialtone.common.messages.GetSupplyObject(temp);
        var message = new jsdialtone.common.messages.EventArgs(decoders.Decoder.Events.ObjectSupplied,
            decodedObject);
        console.log('supply decoding complete.');
        this.emit(decoders.Decoder.Events.ObjectSupplied, message);

    };

    this.processInserts = function(insertObject){

      this.validateSuppliedObject();
      if(!insertObject.rows){
        console.log('No rows property available on insertObject');
        return;
      }
      var table = this.dataObject;
      _.each(insertObject.rows, function(row){table.addRow(row);});
      return jsdialtone.common.messages.GetInsertObject(insertObject.rows);
    };

    this.processUpdates = function(updateObject){

      this.validateSuppliedObject();
      if(!updateObject.updates){
        console.log('No updates property available on updateObject');
        return;
      }
      var table = this.dataObject;
      for(var u=0;u<updateObject.updates.length; u++){
        var update = updateObject.updates[u];
        if(!update[table.columnCfg.keyColumnName]){
          console.log('No rowKey set on update.');
          continue;
        }
        table.setCellValues(update);

      }

      return jsdialtone.common.messages.GetUpdateObject(updateObject.updates);
    };

    this.processDeletes = function(deleteObject){

      this.validateSuppliedObject();
      if(!deleteObject.rowKeys){
        console.log('No rowKeys property available on deleteObject');
        return;
      }
      var table = this.dataObject;
      _.each(deleteObject.rowKeys, function(rowKey){table.removeRow(rowKey);});
      return jsdialtone.common.messages.GetDeleteObject(deleteObject.rowKeys);
    };

  };

  methods.inherit(sws.decoders.sampleDataDecoder,defaultDec.DefaultDataDecoder);
})();




