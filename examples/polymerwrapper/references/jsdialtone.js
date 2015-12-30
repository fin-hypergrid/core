
(function () {
  'use strict';

  /*global console */
  /*global window */
  /*global fin */

  if (window.jsdialtone) {
    console.warn('jsdialtone already defined.');
    return;
  }

  window.jsdialtone = {
    __isReady: false,
    __onReadyCallbacks: [],
    __idFountain: 1
  };
  /**
   * jsdialtone is the root namespace for all dialtone libs
   * @namespace jsdialtone
   */
  var jsdialtone = window.jsdialtone;

  /**
   * this method will create a namespace and add it to the root namspace of jsdialtone. This should typically be used only by jsdialtone library developers
   * @param {string} ns This is the namespace you wish to add to jsdialtone.
   * @returns {{}|*} The fully qualified namespace
   * @function
   * @memberof jsdialtone
   * @example jsdialtone.namespace('configserver') => jsdialtone.configservice
   * jsdialtone.namespace('configserver.controls') => jsdialtone.configservice.controls
   */
  jsdialtone.namespace = function (ns) {
    var parts = ns.split('.');
    if (!parts || parts.length === 0) {
      return;
    }
    var current = jsdialtone;
    var startIndex = 0;
    if(window[parts[0]]){
      current = window[parts[0]];
      startIndex = 1;
    }
    for (var i = startIndex; i < parts.length; i++) {
      var part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    return current;
  };

  jsdialtone.create = function(fullNameSpace, args){

    var parts = fullNameSpace.split('.');
    if(!parts || parts.length === 0){
      return;
    }

    var Current = jsdialtone;
    var startIndex = 0;
    if(window[parts[0]]){
      Current = window[parts[0]];
      startIndex = 1;
    }
    for(var i=startIndex;i<parts.length;i++){
      var part = parts[i];
      if(!Current[part]){
        return;
      }
      Current = Current[part];
    }
    return new Current(args);

  };

  /**
   * This is meant to be for internal use within jsdialtone library only
   * @memberof jsdialtone
   * @type {{ApplicationName: string}}
   */
  jsdialtone.Constants = {
    ApplicationName: 'default',
    ConfigServiceTopicName: 'COUGAR/CONFIGSERVICE'
  };

  /**
   * Returns true if the opefin library is initialised and ready for use. Anyone can call this method to check if they can use th emessagebus or configservice
   * @function
   * @memberof jsdialtone
   * @returns {boolean} true, if the openfin library is initalised. false, otherwise
   */
  jsdialtone.isReady = function () {
    return jsdialtone.__isReady;
  };

  /**
   * Get the current name of the window
   * @function
   * @memberof jsdialtone
   * @returns {string}
   */
  jsdialtone.getWindowName = function () {
    if (jsdialtone.isReady()) {
      return window.fin.desktop.Window.getCurrent().name;
    }
    return "";
  };

  /**
   * Returns a unique incrementing id for the current window. Do not use this from webworkers.
   * @function
   * @memberof jsdialtone
   * @returns {int}
   */
  jsdialtone.getNextId = function () {
    return jsdialtone.__idFountain++;
  };
  /**
   * Allows clients to hook in a callback to be executed once the underlying runtime is ready for use.
   * All subscriptions to the jsdialtone.bus must be done once the runtime is ready. You can call this method
   * multiple times to hook in multiple callbacks, once the runtime is ready, jsdialtone would call these
   * callbacks in that order. If this method is called after jsdialtone is ready, then the callback is
   * fired instantaneously.
   * @function
   * @memberof jsdialtone
   * @example jsdialtone.onReady(function(){
        console.log('Executing again within runtime...');
        jsdialtone.bus.subscribe('MyTopic', function (message) {
           console.log('Received '+ message);
        });
    });
   * @param readyCallback A function that will be called once the underlying runtime is ready.
   */
  jsdialtone.onReady = function (readyCallback) {
    if(jsdialtone.__isReady === true){
      readyCallback();
    }
    else {
      jsdialtone.__onReadyCallbacks.push(readyCallback);
    }
  };

  if (window.document !== undefined) {
    window.document.addEventListener("DOMContentLoaded", function (evt) {
        if (fin !== undefined && fin.desktop !== undefined) {
            fin.desktop.main(function() {
                jsdialtone.__isReady = true;
                for (var i = 0; i < jsdialtone.__onReadyCallbacks.length; i++) {
                    var callback = jsdialtone.__onReadyCallbacks[i];
                    if (callback) {
                        callback();
                    }
                }
                jsdialtone.__onReadyCallbacks.length = 0;

            });
        }
    });
  }
})();
;/**
 * @function
 */
(function () {
  "use strict";
  /*global fin */
  /*global console */
  /*global jsdialtone */

  /**
   * bus is used to exchange messages between cougar and HTML. You can use this class to send and broadcast messages. Refer to the API for example on how to do this.
   * {@link http://confluence.barcapint.com/pages/viewpage.action?pageId=412883809}
   * @memberof jsdialtone
   * @class bus
   */
  var bus = jsdialtone.namespace('bus');
  jsdialtone.bus = (function () {
    var __subscribeTopicCallbacks = {};
    var __busObject;

    function addToCallbackMap(topic, cb, innerCb) {
      if (topic in __subscribeTopicCallbacks) {
        if (!(cb in __subscribeTopicCallbacks[topic])) {
          __subscribeTopicCallbacks[cb] = innerCb;
        }
      }
      else {
        __subscribeTopicCallbacks[topic] = cb;
        __subscribeTopicCallbacks[topic][cb] = innerCb;
      }
    }

    function removeFromCallbackMap(topic, cb) {
      if (topic in __subscribeTopicCallbacks) {
        if (cb in __subscribeTopicCallbacks[topic]) {
          delete __subscribeTopicCallbacks[topic][cb];
        }
      }
    }

    function containsCallback(topic, cb) {
      return topic in __subscribeTopicCallbacks && cb in __subscribeTopicCallbacks[topic];
    }

    function getCallback(topic, cb) {
      if(containsCallback(topic, cb)) {
        return __subscribeTopicCallbacks[topic][cb];
      }
    }

    function sendMessage(topic, dialtoneMessage) {
      if (!jsdialtone.isReady()) {
        console.warn("The bus is not yet initialised. Please check jsdialtone.isReady() before trying to send messages");
        return;
      }

      getBus().send(jsdialtone.Constants.ApplicationName, topic, dialtoneMessage);
    }

    function getDialToneMessage(windowName, message) {
      return {
        dialtoneWindowName: windowName,
        payload: message
      };
    }

    /**
     * Set a bus object. This will primarily be used for mocking purposes
     * @function
     * @memberof jsdialtone.bus
     * @param {bus} - Set the fin.desktop.InterApplicationBus or a mock object
     */
    function setBus(bus) {
      __busObject = bus;
    }

    /**
     * Get the Bus object. This will typically by of type fin.desktop.InterApplicationBus unless the object has been mocked out
     * @function
     * @memberof jsdialtone.bus
     * @returns {fin.desktop.InterApplicationBus}
     */
    function getBus() {
      if (__busObject === undefined) {
        if (jsdialtone.isReady()) {
          __busObject = fin.desktop.InterApplicationBus;
        }
      }
      return __busObject;
    }


    /**
     * @description Subscribe to a topic on the messagebus. All messages sent from .NET on this topic will be received by this handler. However,
     * the message will be checked to see if it is wrapped in a dialtone message. If yes, we will see if the message was sent to this particular window and only then
     * will the callback be invoked. If this is not a dialtone wrapped message, we will directly invoke the callback
     * @function
     * @memberof jsdialtone.bus
     * @param {string} topic A case-sensitive topic name. (Topics should follow the convention of <APPNAME>/<TOPICSUBJECT>/<OPTIONAL SUB LEVELS>
     * @param {function(data)} subscribeCallback The callback which will do application specific work when this message is received
     * @example jsdialtone.bus.subscribe("SWS/TRADE/12345", function(data) {console.log(JSON.stringify(data))});
     */
    function subscribe(topic, subscribeCallback) {
      if (!jsdialtone.isReady()) {
        console.warn("The bus is not yet initialised. Please check jsdialtone.isReady() before calling any subscriptions");
        return;
      }
      var filterByTopic = function (data) {
        var windowName = data.dialtoneWindowName;
        if (windowName !== undefined) {

          if (windowName === "*" || (jsdialtone.getWindowName() === data.dialtoneWindowName)) {
            subscribeCallback(data.payload);
          }
        }
        else {
          subscribeCallback(data);
        }
      };
      getBus().subscribe("*", topic, filterByTopic);
      addToCallbackMap(topic, subscribeCallback, filterByTopic);
    }

    /**
     * Unsubscribe this topic and callback from the bus
     * @function
     * @memberof jsdialtone.bus
     * @param {string} topic
     * @param {function(data:string)} callback The callback function that was registered with the bus when subscribe was called
     */
    function unsubscribe(topic, callback) {
      if (!jsdialtone.isReady()) {
        console.warn("The bus is not yet initialised. Please check jsdialtone.isReady() before calling any subscriptions");
      }
      if (containsCallback(topic, callback)) {
        var innerCb = getCallback(topic, callback);
        getBus().unsubscribe("*", topic, innerCb);
        removeFromCallbackMap(topic, callback);
      }
    }

    /**
     * Send a message on a topic over the messagebus.
     * @function
     * @memberof jsdialtone.bus
     * @param topic A case-sensitive topic name. (Topics should follow the convention of <APPNAME>/<TOPICSUBJECT>/<OPTIONAL SUB LEVELS>
     * @param message The message to be sent to the client
     * @example jsdialtone.bus.send("SWS/CLIENT/TRADELISTENER", {"data": "12345"});
     */
    function send(topic, message) {

      var dialtoneMessage = getDialToneMessage(jsdialtone.getWindowName(), message);
      sendMessage(topic, dialtoneMessage);
    }

    /**
     * Broadcasts a message on a topic over the messagebus to all listeners.
     * @function
     * @memberof jsdialtone.bus
     * @param topic A case-sensitive topic name. (Topics should follow the convention of <APPNAME>/<TOPICSUBJECT>/<OPTIONAL SUB LEVELS>
     * @param message The message to be broadcasted over the bus.
     * @example jsdialtone.bus.broadcast("SWS/CLIENT/TRADELISTENER", {"data": "12345"});
     */
    function broadcast(topic, message) {
      var dialtoneMessage = getDialToneMessage("*", message);
      sendMessage(topic, dialtoneMessage);
    }

    // Create public functions and return them here
    return {
      setBus: setBus,
      getBus: getBus,
      subscribe: subscribe,
      unsubscribe: unsubscribe,
      send: send,
      broadcast: broadcast
    };
  }());

}());
;/**
 * @function
 */
/*global jsdialtone */
/*global Conversation */

/**
 * configservice is used to retrieve config from cougar. This class is used similar to an http get which returns a promise. See the API for a usage example.
 * @class configservice
 * @memberof jsdialtone
 */
var configserviceNs = jsdialtone.namespace('configservice');
(function (ns) {
  "use strict";
    /**
     * Queries Cougar for a config object based on the name and returns a promise object. You can handle it similar to $http in angular
     * @param {json|String} name - The control or component for which you want to retrieve the configuration. This can be a json or string
     * @function
     * @memberof jsdialtone.configservice
     * @returns {Promise} A promise object that will allow you to handle success and failure conditions
     * @example jsdialtone.configservice.getConfig('PortfolioSearchPanel').then(function(configdata) {
   *  console.log("Success" + configdata);
    *  }, function(failure) {
    *  console.error("failed" + failure);
    *  });
     */
    ns.getConfig = function (data) {
      var conversation = new jsdialtone.Conversation(jsdialtone.Constants.ConfigServiceTopicName);
      return conversation.getConfig(data);
    };

}(configserviceNs));
;(function(){
    "use strict";
    /*global jsdialtone */

    var cougarActions = jsdialtone.namespace('cougarActions');
    cougarActions.setTitle = 'SETTITLE';
    cougarActions.close = 'CLOSE';
})();

;(function(){
    "use strict";

    /*global jsdialtone */

    var cougarTopicsP = jsdialtone.namespace('cougarTopics.pub');
    cougarTopicsP.cougar_window = 'COUGAR/WINDOW';
    cougarTopicsP.cougar_logger = 'COUGAR/LOGGER';

    var cougarTopicsS = jsdialtone.namespace('cougarTopics.sub');
    cougarTopicsS.cougar_window = 'COUGAR/WINDOW';

})();

;(function(){
    'use strict';
    /*global jsdialtone */
    /*global console */

    /**
     * browser is used to perform windowing functions i.e. control a cougar/c# window from HTML by sending events over the bus. Usage examples can be found {@link http://confluence.barcapint.com/display/capl/browser+-+Controlling+your+.NET+window+from+javascript}.

     * @class browser
     * @memberof jsdialtone
     */
    var browser = jsdialtone.namespace('browser');

    /**
     * @description Sets the title of the browser window to the value specified as argument title.
     * @function
     * @memberof jsdialtone.browser
     * @param {string} title A string that needs to the title of the window.
     * @example jsdialtone.browser.setTitle('MyTitle');
     */
    browser.setTitle = function(title){

        console.log('Setting title %s', title);
        jsdialtone.bus.send(jsdialtone.cougarTopics.pub.cougar_window,
            {action: jsdialtone.cougarActions.setTitle, args: {title: title}});
    };

    /**
     * @description Closes the browser window.
     * @function
     * @memberof jsdialtone.browser
     * @example jsdialtone.browser.close();
     */
    browser.close = function(){
        console.log('Closing window');
        jsdialtone.bus.send(jsdialtone.cougarTopics.pub.cougar_window,
            {action: jsdialtone.cougarActions.close});
    };

})();
;/**
 * @function
 */
(function (ns) {
  "use strict";
  /*global Promise */
  /*global console */
  /*global jsdialtone */

  /**
   *
   * @class Conversation
   * @memberof jsdialtone
   * @param {string} publishtopic - The topic on which this conversation will be started
   * @constructor
   */
 jsdialtone.Conversation = function(publishtopic) {
   var topic = publishtopic;

   var getUniqueTopicSuffix = function () {
     return jsdialtone.getWindowName() + "-" + jsdialtone.getNextId();
   };

   /**
    * Performs a request over the bus on the specified topic and returns the result over a temporary topic that will be destroyed once the response is received
    * @param {json|string} requestData - This is the data that will be sent to the client as part of the request. This can be a json object or a plain string
    * @returns {Promise} - Returns a promise object which can be handled by the client to manage success and error conditions
    * @example jsdialtone.configservice.getConfig('ticketprefs').then(
          function(data) {
           console.log('data received :' + JSON.stringify(data);
          },
          function(err) {
            console.error(err);
          });
    */
   var getConfig = function (requestData) {

     var replyTopic = topic + getUniqueTopicSuffix();
     var message = {
       replyTopic: replyTopic,
       payload: requestData
     };
     var promise = new Promise(function (resolve, reject) {
       if (!jsdialtone.isReady()) {
         reject(Error("The bus is not ready. Please check jsdialtone.isReady() before calling any methods on it"));
       }
       else {
         var resolveFn = function (data) {
           if (data === undefined) {
             return;
           }
           jsdialtone.bus.unsubscribe(replyTopic, resolveFn);
           resolve(data);
         };
         jsdialtone.bus.subscribe(replyTopic, resolveFn);
         jsdialtone.bus.send(topic, message);
       }
     });
     return promise;
   };

   return {
     getConfig: getConfig
   };
 };
}());
;/* Logger.js */
/**
 * This allows any logs written to the console to be captured within the cougar log files via openfin.(topic= fin-logger).
 JS => .NET (log4NET)
 console.log() => Logger.Info() ,  console.info() => Logger.Info(), console.debug() => Logger.debug(), similarly warn and error.
 However there are 2 ways to switch to native logging or custom logging (native + record to .NET log files)
 Default mode:  Logger enabled.
 1) URL queryString (Not case-sensitive)
 To turn OFF: URL?LOGGER=FALSE  or URL?Logger=False
 To turn ON: URL?LOGGER=TRUE or URL?Logger=True, or just URL, which uses default mode
 2) JS code level or Console DevTools (case-sensitive)
 Note: This will override URL queryString settings
 To turn OFF: Logger=False
 To turn ON:  Logger=True
 */


/**
 * This will call  initializeLogger() before executing 'DOMContentLoaded' event
 */
(function(){
    'use strict';
    /*global jsdialtone */
    /*global console */
    if (window.document && window.document.addEventListener) {
        document.addEventListener("DOMContentLoaded", function () {
            initializeLogger();
        }, false);
    }

    /**
     * sets defaultLogging mode
     * checks URL queryString and enables logging mode
     * wireLogging methods
     */
    function initializeLogger() {
        var defaultloggermode = true;
        setLogger(defaultloggermode);
        checkURLAndEnableLogger();
        wireLogging();
    }


//***********************************private functions(BEGIN)*************************************************************
    /**
     * This function updates globalVariable Logger
     * Logger value true uses custom logging and false switches to native logging.
     * @param enable
     */
    function setLogger(enable) {
        jsdialtone.Logger = enable;
    }

    /**
     * process Logger URL queryString parameter LOGGER=FALSE or Logger = False (* Not case sensitive)
     * If False/True, updates global Window.Logger
     */
    function checkURLAndEnableLogger() {
        try {
            // read UrlParameters
            var urlLoggerVarFound = ((getUrlVars().length > 0) && ((typeof getUrlVars().LOGGER) !== 'undefined'));
            if (urlLoggerVarFound) {
                var loggerFlag = getUrlVars().LOGGER;
                //detect FALSE flag
                if (loggerFlag.match(/^(FALSE)$/)) {
                    setLogger(false);
                } // not required to handle TRUE Case, since defaultLOGGERMODE = true
            }
        } catch (err) {
            window.console.error(err.message);
        }
    }

    /**
     * example : location.href = http://localhost:8080/home.html?Logger=False
     * or : location.href = http://localhost:8080/home.html?LOGGER=FALSE
     * takes current url and check queryString(s) exists,if yes then first queryString parameter taken
     * @returns {Array} arr['LOGGER'] = FALSE;
     */
    function getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            if (hash.length > 0) {
                hash = hash.map(function (str) {
                    return str.toUpperCase();
                });
            }
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }

    /**
     * function which checks passed arguments contains array
     * example:['1'].containsArray() gives -1; ['1','2',['hello']].containsArray() gives 2
     * @returns boolean
     */
    Array.prototype.containsArray = function () {
        var i = this.length;
        while (i--) {
            if (this[i] && this[i].constructor.toString().indexOf("Array") > -1) {
                return i;
            }
            else {
                return -1;
            }
        }
        return false;
    };

    /**
     *
     * @param arguments
     * @returns {Array.<T>} return Array of arrays into single Array
     */
    function processConsoleArguments(logArgs) {
        var args = Array.prototype.slice.call(logArgs);
        if (args.length > 1) {
            if (args.containsArray()) {
                var merged = [];
                args = merged.concat.apply(merged, args);
            }
        }
        return args;
    }
    /**
     * self invoking function, which wires native console.log functionality to window.log call
     *  window.log executes console.log/warn/error/info/debug
     *  usage: window.log("hello world") internally call console.log("hello world")
     */
    /* This file executes native console.log/warn/error/info/debug messages  */
    (function () {
        var method;
        var loop = function () { };
        var methods = [
            'debug', 'info', 'log',
            'warn', 'error'
        ];
        var length = methods.length;
        var console = (window.console = window.console || {});

        while (length--) {
            method = methods[length];

            // Only stub undefined methods.
            if (!console[method]) {
                console[method] = loop;
            }
        }
        if (Function.prototype.bind) {
            window.log = Function.prototype.bind.call(console.log, console);
        }
        else {
            window.log = function () {
                Function.prototype.apply.call(console.log, console, arguments);
            };
        }
    })();

    /**
     *console.log(1,2,3,45,"111",["a:2"]);
     * publishes to cougar log as=2015-06-25 15:00:11,337 [3] INFO  BrowserConsole - [Url:http://localhost:8080/home.html]-1 2 3 45 111 a:2
     * scroll down bottom of page for more message types.
     * @param logType : info/debug/log/warn/error
     * @param args : console.logType arguments - Array separated by space if multiple values passed
     */
    function publishToOpenFin(parameters) {
        var logType = parameters.logType;
        var args = parameters.args;

        if (typeof window.fin === "undefined")
        {
            jsdialtone.Logger = false; // This is to avoid stack overflow.
            window.console.warn("OpenFin desktop runtime not loaded.");
            return;
        }

        jsdialtone.bus.send(jsdialtone.cougarTopics.pub.cougar_logger,
            {
                level: logType,
                arguments: args.join(" ").toString()
            });

    }

    /**
     * This wraps console.log/info/warn/debug/error functions
     * Based on window.Logger setting, true = writes to cougar log files, false = resets to native console api
     */
    function wireLogging() {
        var log = window.console.log,
            debug = window.console.debug,
            error = window.console.error,
            warn = window.console.warn,
            info = window.console.info;

      /**
       * This private funtion is a hacky check to see if we are getting error messages due to the .NEt code not
       * subscribing to COUGAR/P/LOGGER. If yes, then disable openfin logging else we end up with an infinite log loop
       */
        var isLoggerPublishError = function(arr) {
          if(arr === undefined || arr[0] === undefined || arr[0].length === 0) {
            return false;
          }
          var errStr = arr[0];
          return (errStr.indexOf("send-message") > 0 &&
            errStr.indexOf("\"topic\":\"COUGAR/LOGGER\"") &&
            errStr.indexOf("\"success\":false") > 0);
        };

      /**
       * This function does the actual logging to console and openfin(if it is enabled)
       * @param logLevelFn - Takes a log function that is the acutal window.console function
       * @param logLevelStr - The log level string to write
       * @param logArgs - The arguments passed by clients to the log function
       */
        var doLog = function(logLevelFn, logLevelStr, logArgs) {
            if ((logArgs === undefined) || (logArgs === null)) {
                return;
            }

           logLevelFn.apply(window.console, logArgs);
            if (jsdialtone.Logger && jsdialtone.isReady()) {
                var args = processConsoleArguments(logArgs);
                if(logLevelStr === "error" && isLoggerPublishError(args)) {
                  jsdialtone.Logger = false;
                  console.warn("Error encountered when publishing log messages to .NET. Reverting to only console logs");
                  return;
                }
                publishToOpenFin({ logType: logLevelStr, args: args });
            }
        };

        window.console.log = function () {
            doLog(log, "info", arguments);
        };

        window.console.debug = function () {
          doLog(debug, "debug", arguments);
        };

        window.console.error = function () {
          doLog(error, "error", arguments);
        };

        window.console.warn = function () {
          doLog(warn, "warn", arguments);
        };

        window.console.info = function () {
          doLog(info, "info", arguments);
        };

    }
})();







;(function(){
  'use strict';

  var methods = jsdialtone.namespace('utilities.methods');
  methods.inherit = function(child, base){

    child.prototype = Object.create(base.prototype);
    child.prototype.constructor = child;

  };
}());


;(function () {
  'use strict';
  var messages = jsdialtone.namespace('common.messages');

  messages.DialToneError = function(message){

    this.message = message;
    this.stack = (new Error()).stack;
    messages.DialToneError.prototype.toString = function(){
      return this.message;
    };
  };

  messages.DialToneError.prototype = Error.prototype;
  messages.DialToneError.prototype.constructor = messages.DialToneError;
})();


;(function () {
  'use strict';
  var messages = jsdialtone.namespace('common.messages');
  messages.EventArgs = function(name, data){
    this.name = name;
    this.eventData = data;
  };
})();

;(function () {
  'use strict';
  var messages = jsdialtone.namespace('common.messages');
  messages.Event = function(sender, args) {
    this.sender = sender;
    this.eventArgs = args;
  };
})();
;(function () {
  'use strict';
  var messages = jsdialtone.namespace('common.messages');
  messages.Message = function(){
    this.topic = '';
    this.type = '';
    this.content = '';
  };
})();
;(function(){
  'use strict';

  var messages = jsdialtone.namespace('common.messages');

  messages.ChangeType = (function(){
    return {
      Supply: 'Supply',
      Insert: 'Insert',
      Update: 'Update',
      Delete: 'Delete',
      Error: 'Error'
    };
  })();

  messages.DecodedObject = {
    changeType:undefined,
    decodedObject:undefined
  };


  messages.GetSupplyObject = function(dataObject){

    var supplyObject = Object.create(messages.DecodedObject);
    supplyObject.changeType = messages.ChangeType.Supply;
    supplyObject.decodedObject = dataObject;
    return supplyObject;
  };

  messages.GetInsertObject = function(rows){

    var insertObject = Object.create(messages.DecodedObject);
    insertObject.changeType = messages.ChangeType.Insert;
    insertObject.decodedObject = rows;
    return insertObject;
  };

  messages.GetDeleteObject = function(rowKeys){

    var deleteObject = Object.create(messages.DecodedObject);
    deleteObject.changeType = messages.ChangeType.Delete;
    deleteObject.decodedObject = rowKeys;
    return deleteObject;
  };

  messages.GetUpdateObject = function(updatedCells){

    var updatedObject = Object.create(messages.DecodedObject);
    updatedObject.changeType = messages.ChangeType.Update;
    updatedObject.decodedObject = updatedCells;
    return updatedObject;
  };




})();

;(function () {
  'use strict';
  var messages = jsdialtone.namespace('common.messages');
  messages.WorkerMessage = function(){
    this.command = null;
    this.content = null;
  };
})();

;(function () {
  'use strict';
  var messages = jsdialtone.namespace('common.messages');
  messages.ServerMessageType = (function() {
    return {
      Supply: 'DataObject',
      Insert: 'ServerInsert',
      Update: 'ServerUpdate',
      Delete: 'ServerDelete',
      Error: 'ServerError'
    };
  })();
})();
;(function(){
  'use strict';
  var items = jsdialtone.namespace('common.items');
  items.ItemState = (function() {
    return {
      Starting: 'Starting',
      Started: 'Started',
      Stopping: 'Stopping',
      Stopped: 'Stopped'
    };
  })();
})();

;(function(){
  'use strict';

  var items = jsdialtone.namespace('common.items');
  var messages = jsdialtone.namespace('common.messages');

  /**
   * Base implementation of items whose settings can be stored in FID Config.

   * @class DynamicItem
   * @memberof jsdialtone.common.items
   */
  items.DynamicItem = function(id){

    this.id = id;
    this.itemState = jsdialtone.common.items.ItemState.Stopped;

    /**
     * Standard implementation of Start to do the status etc plumbing - actual
     *work is specified by the derived class in doStart
     *@function start
     *@memberof  jsdialtone.common.items.DynamicItem
     */
    items.DynamicItem.prototype.start = function(){

      console.log('Starting item %s', this.id);
      if(!this.doStart){
        throw new messages.DialToneError('doStart is not implemented by ' +this.id);
      }
      this.itemState = items.ItemState.Starting;
      this.emit(items.DynamicItem.Events.Starting);
      this.doStart();
      this.itemState = items.ItemState.Started;
      this.emit(items.DynamicItem.Events.Started);
      console.log('Started item %s', this.id);
    };

    /**
     * Standard implementation of Stop to do the status etc plumbing - actual
     * work is specified by the derived class in doStop
     *@function stop
     *@memberof  jsdialtone.common.items.DynamicItem
     */
    items.DynamicItem.prototype.stop = function(){

      console.log('Stopping item %s', this.id);
      if(!this.doStop){
        throw new messages.DialToneError('doStop is not implemented by ' +this.id);
      }
      this.itemState = jsdialtone.common.items.ItemState.Stopping;
      this.emit(items.DynamicItem.Events.Stopping);
      this.doStop();
      this.itemState = items.ItemState.Stopped;
      this.emit(items.DynamicItem.Events.Stopped);
      console.log('Stopped item %s', this.id);

    };

    /**
     *@function restart
     *@memberof  jsdialtone.common.items.DynamicItem
     */
    items.DynamicItem.prototype.restart = function(){
      console.log('Restarting item %s', this.id);
      this.stop();
      this.start();
    };
  };

  items.DynamicItem.Events = (function(){
    return {

      Starting: 'Starting',
      Started: 'Started',
      Stopping: 'Stopping',
      Stopped: 'Stopped'
    };
  })();
})();



;(function(){
  'use strict';
  var dataObjects = jsdialtone.namespace('dataObjects');
  dataObjects.DataColumnCfg = function(){

    this.columns = [];
    this.keyColumnName = '';
    var self = this;

    this.containsColumn = function(column){
      var existingIndex = _.findIndex(self.columns, function(x){return x === column;});
      return existingIndex >= 0;
    };

    this.containsColumnIndex = function(columnIndex){

      return columnIndex < self.columns.length;

    };

  };
})();


;(function(){
  'use strict';

  var dataObjects = jsdialtone.namespace('dataObjects');

  dataObjects.DataTable = function(tableColumnCfg){

    this.columnCfg = tableColumnCfg;
    this.rows = [];
    this.rowMap = {};
    this.inserts = [];
    this.updates = {};
    this.deletes = [];
    var self = this;

    dataObjects.DataTable.prototype.setRows = function(suppliedRows){

      self.rows = [];
      self.rows = suppliedRows;
      _.each(self.rows, function(r){
        var key = r[self.columnCfg.keyColumnName];
        self.rowMap[key] = r;
      });
    };

    dataObjects.DataTable.prototype.getRowCount = function(){
      return self.rows.length;
    };

    dataObjects.DataTable.prototype.findRowByIndex = function(index){
      if(index !== -1 && index < self.getRowCount()){
        return self.rows[index];
      }
    };

    dataObjects.DataTable.prototype.findRowByKey = function(rowKey){

      return self.rowMap[rowKey];
    };

    dataObjects.DataTable.prototype.addRow = function(row){

      var keyColumnName = self.columnCfg.keyColumnName;
      var rowKey = row[keyColumnName];
      if(!rowKey){
        var e = new jsdialtone.common.messages.DialToneError();
        e.message = 'Key value cannot be empty';
        throw e;
      }
      var existingRow = self.findRowByKey(rowKey);
      if(existingRow){
        var em = new jsdialtone.common.messages.DialToneError();
        em.message = 'Duplicate key added: ' + rowKey;
        throw em;
      }

      self.rows.push(row);
      self.rowMap[rowKey] = row;
      self.inserts.push(row);
    };

    dataObjects.DataTable.prototype.removeRow = function(rowKey){

      var existingRow = self.findRowByKey(rowKey);
      if(!existingRow){
        var e = new jsdialtone.common.messages.DialToneError();
        e.message = 'Cannot find row to remove with key: ' + rowKey;
        throw e;
      }
      self.deletes.push(rowKey);
      self.rows.splice(existingRow, 1);
      delete self.rowMap[rowKey];
    };

    dataObjects.DataTable.prototype.removeRowAt = function(index){

      if(index >= self.rows.length){
        var e = new jsdialtone.common.messages.DialToneError();
        e.message = 'Cannot find row to remove with index: ' + index;
        throw e;
      }

      var existingRow = self.rows[index];
      var rowKey = existingRow[self.columnCfg.keyColumnName];
      self.deletes.push(rowKey);
      self.rows.splice(index, 1);
      delete self.rowMap[rowKey];
    };

    dataObjects.DataTable.prototype.getCellValueByName = function(rowIndex, columnName){

      if(rowIndex < self.rows.length){
        var row = self.rows[rowIndex];
        return row[columnName];
      }

    };

    dataObjects.DataTable.prototype.setCellValueByName = function(rowIndex, columnName, cellValue){
      if(rowIndex >= self.rows.length || !self.columnCfg.containsColumn(columnName)){
        var e = new jsdialtone.common.messages.DialToneError();
        e.message = 'Cannot find a cell with rowIndex: ' + rowIndex + ' and columnName: ' + columnName;
        throw e;
      }
      var row = self.rows[rowIndex];
      row[columnName] = cellValue;
      var rowKey = row[self.columnCfg.keyColumnName];
      flagUpdate(self.updates, rowKey, columnName, cellValue);
    };

    dataObjects.DataTable.prototype.getCellValueByIndex = function(rowIndex, columnIndex){
      if(rowIndex < self.rows.length){
        var row = self.rows[rowIndex];
        var columnName = self.columnCfg.columns[columnIndex];
        return row[columnName];
      }
    };

    dataObjects.DataTable.prototype.setCellValueByIndex = function(rowIndex, columnIndex, cellValue){

      if(rowIndex >= self.rows.length || !self.columnCfg.containsColumnIndex(columnIndex)){
        var e = new jsdialtone.common.messages.DialToneError();
        e.message = 'Cannot find a cell with rowIndex: ' + rowIndex + ' and columnIndex: ' + columnIndex;
        throw e;
      }
      var row = self.rows[rowIndex];
      var columnName = self.columnCfg.columns[columnIndex];
      row[columnName] = cellValue;
      var rowKey = row[self.columnCfg.keyColumnName];
      flagUpdate(self.updates, rowKey, columnName, cellValue);
    };

    dataObjects.DataTable.prototype.getCellValue = function(rowKey, columnName){
      var existingRow = self.findRowByKey(rowKey);
      if(existingRow){
        return existingRow[columnName];
      }
    };

    dataObjects.DataTable.prototype.setCellValue = function(rowKey, columnName, cellValue){

      var existingRow = self.findRowByKey(rowKey);
      if(!existingRow){
        var e = new jsdialtone.common.messages.DialToneError();
        e.message = 'Cannot find a row with rowKey: ' + rowKey;
        throw e;
      }

      if(!existingRow.hasOwnProperty(columnName)){
        var em = new jsdialtone.common.messages.DialToneError();
        em.message = 'Column does not exist: ' + columnName;
        throw em;
      }
      existingRow[columnName] = cellValue;
      flagUpdate(self.updates, rowKey, columnName, cellValue);

    };

    dataObjects.DataTable.prototype.setCellValues = function(update){

      var rowKey = update[self.columnCfg.keyColumnName];
      var existingRow = self.findRowByKey(rowKey);
      if(!existingRow){
        console.log('Cannot find a row with rowKey: ' + rowKey);
        return;
      }
      for(var columnName in update){
        if(existingRow.hasOwnProperty(columnName)) {

          existingRow[columnName] = update[columnName];
          flagUpdate(self.updates, rowKey, columnName, update[columnName]);
        }
        else{
          console.log('Column does not exist: %s', columnName);
          continue;
        }
      }
    };

    dataObjects.DataTable.prototype.fastAddRows = function(addedRows){
      _.each(addedRows, function(r){
        self.rows.push(r);
        var key = r[self.columnCfg.keyColumnName];
        self.rowMap[key] = r;
        self.inserts.push(r);
      });

    };

    dataObjects.DataTable.prototype.fastDeleteRows = function(deletedRowKeys){
      _.each(deletedRowKeys, function(d){

        self.removeRow(d);

      });
    };

    dataObjects.DataTable.prototype.fastUpdateRows = function(updates){
      _.each(updates, function(u){

        var key = u[self.columnCfg.keyColumnName];
        var existingRow = self.rowMap[key];
        for(var columnName in u){
          if(existingRow.hasOwnProperty(columnName)) {
            existingRow[columnName] = u[columnName];
            flagUpdate(self.updates, key, columnName, u[columnName]);
          }
        }

      });
    };

    dataObjects.DataTable.prototype.resetChanges = function(){
      self.inserts.length = 0;
      self.updates.length = 0;
      self.deletes.length = 0;
    };

    dataObjects.DataTable.prototype.hasChanges = function(){

      return Object.keys(self.updates).length > 0 || self.inserts.length > 0 ||
        self.deletes.length > 0;
    };

    function flagUpdate(updates, rowKey, column, value){
      var update;
      if(updates[rowKey]){
        update = updates[rowKey];
      }
      else{
        update = {};
        updates[rowKey] = update;
      }
      update[column] = value;
    }

  };

})();




;(function(){
  'use strict';
  var dataObjects = jsdialtone.namespace('dataObjects');
  dataObjects.DataTableManager = (function(){

    var dataTable;
    function getDataTable(tableObject){
      var rows = tableObject.rows;
      var columnCfg = tableObject.columnCfg;
      var tableColumnCfg = new jsdialtone.dataObjects.DataColumnCfg();
      tableColumnCfg.keyColumnName = columnCfg.keyColumnName;
      _.each(columnCfg.columns, function(x){tableColumnCfg.columns.push(x);});
      dataTable = new jsdialtone.dataObjects.DataTable(tableColumnCfg);
      dataTable.setRows(rows);
      return dataTable;
    }

    return {
      getDataTable: getDataTable
    };

  })();

})();


;(function (){
  'use strict';

  var items = jsdialtone.namespace('common.items');
  var messages = jsdialtone.namespace('common.messages');
  var methods = jsdialtone.namespace('utilities.methods');
  var transports = jsdialtone.namespace('transports');

  transports.Transport = function(id){

    items.DynamicItem.call(this, id);
    this.environmentSettings = null;
    this.connected = false;
    _.extend(this, new EventEmitter());

    transports.Transport.prototype.createChannel = function(channelId){
      if(!this.doCreateChannel){
        throw new messages.DialToneError('doCreateChannel is not implemented by ' + this.id);
      }
      return this.doCreateChannel(channelId);
    };

    transports.Transport.prototype.bindChannel = function(channel){
      if(!this.doBindChannel){
        throw new messages.DialToneError('doBindChannel is not implemented by ' + this.id);
      }
      this.doBindChannel(channel);
    };

    transports.Transport.prototype.fireOnConnected = function(data){

      this.connected = true;
      console.log('Transport %s connected', this.id);
      var args = new messages.EventArgs(jsdialtone.transports.Transport.Events.Connected, data);
      this.emit(transports.Transport.Events.Connected,
        new messages.Event(this, args));
    };

    transports.Transport.prototype.fireOnDisconnected = function(){

      this.connected = false;
      var args = new messages.EventArgs
      (transports.Transport.Events.Disconnected);
      this.emit(transports.Transport.Events.Disconnected,
        new messages.Event(this, args));
    };

    transports.Transport.prototype.send = function(message){
      if(!this.doSend){
        throw new messages.DialToneError('doSend is not implemented by ' + this.id);
      }
      this.doSend(message);

    };


  };
  methods.inherit(transports.Transport, items.DynamicItem);

  transports.Transport.Events = (function(){
    return {

      Connected: 'Connected',
      Disconnected: 'Disconnected'
    };
  })();

})();


;(function () {
  'use strict';
  var transports = jsdialtone.namespace('transports');
  var http = jsdialtone.namespace('transports.http');
  var methods = jsdialtone.namespace('utilities.methods');
  var messages = jsdialtone.namespace('common.messages');
  var httpChannels = jsdialtone.namespace('channels.http');

  // WeakMap is the best possible way at the moment to implement private variables, in terms of truly hiding
  // data and not impact garbage collection adversely.
  var privateParts = new WeakMap();

  http.HttpTransport = function(id){

    transports.Transport.call(this, id);

    var privatePart = (function(instance){

        var transport = instance;
        //wiltest
        var ht = angular.element('html');
        var htt = ht.injector();
        //var httpService = angular.element('html').injector().get('$http'); // This could be some other http library.
        var httpService = htt.get('$http'); // This could be some other http library.
      var activePromise = null;
      var canceller = null;
      var resolver = null;

      function startListening(){

        setTimeout(function(){
          transport.fireOnConnected();
        }, 1);

      }

      function stopListening()
      {
        setTimeout(function(){
          transport.fireOnDisconnected();
        }, 1);
      }

      function send(e, messageCallback){

        // Check if there is an existing active promise. If yes, cancel it.
        if(activePromise !== null){
          if(activePromise.$$state.status === 0){ // This means pending, a request is already is process.
            resolver();
          }
        }

        canceller = new Promise(function(resolve, reject){
          resolver = resolve;
        }.bind(this));

        var msg = e.content;
        var fullUrl = msg.Url;
        //console.log('Sending on transport %s', transport.hashCode);
        if(msg.IsAbsoluteUrl === 'false') {
          fullUrl = transport.environmentSettings.serverUrl + msg.Url;
        }
        msg.Headers.timeout = canceller;
        activePromise = httpService.get(fullUrl, msg.Headers);
        activePromise.then(function(response){
          messageCallback(response);
        }, function(error){
          messageCallback(error);
        });

      }

      return{
        startListening: startListening,
        stopListening: stopListening,
        send: send
      };

    }(this));

    privateParts.set(this, privatePart); // This would bind 'this' object with the privatePart.

    http.HttpTransport.prototype.doStart = function(){

      privateParts.get(this).startListening();

    };

    http.HttpTransport.prototype.doStop = function(){
      privateParts.get(this).stopListening();
    };

    http.HttpTransport.prototype.doBindChannel = function(channel){

      if(!(channel instanceof httpChannels.HttpChannel)){
        throw new messages.DialToneError('channel is not a HttpChannel');
      }
      channel.setTransport(this);

    };

    http.HttpTransport.prototype.doCreateChannel = function(channelId){
      var newChannel = new httpChannels.HttpChannel(channelId);
      this.bindChannel(newChannel);
      return newChannel;
    };

    http.HttpTransport.prototype.send = function(requestMessage, callback){
      privateParts.get(this).send(requestMessage, callback);
    };

    http.HttpTransport.prototype.onDeserialization = function(settings){
      var promise = new Promise(onDeserialize(settings).bind(this));
      return promise;
    };

    function onDeserialize(settings){

      return function(resolve, reject){
        try{
          //console.log('onDeserialization %s', this.hashCode);
          this.id = settings.Id;
          this.environmentSettings = {};
          this.environmentSettings.serverUrl = settings.EnvironmentSettings.ServerUrl;
          resolve(this);
        }
        catch(error){
          reject(error);
        }
      };

    }

  };

  methods.inherit(http.HttpTransport, transports.Transport);

  //http.HttpTransport.Events = function(){
  //  return {
  //
  //    ResponseReceived: 'ResponseReceived'
  //  };
  //}();

})();
;(function () {
  'use strict';

  var channels = jsdialtone.namespace('channels');
  var messages = jsdialtone.namespace('common.messages');
  var methods = jsdialtone.namespace('utilities.methods');
  var items = jsdialtone.namespace('common.items');
  var transports = jsdialtone.namespace('transports');

  var privateParts = new WeakMap();

  channels.Channel = function(id) {

    items.DynamicItem.call(this, id);
    _.extend(this, new EventEmitter());
    this.topics = [];
    this.transport = null;

    var privatePart = (function(instance){
      var channel = instance;

      function onTransportConnected(e){
        var transportData = e.eventArgs.eventData;
        channel.startSubscriptions(transportData);
        channel.emit(channels.Channel.Events.Connected);
      }

      function onTransportStopping(e){
        channel.stopSubscriptions();
        channel.emit(channels.Channel.Events.Disconnected);
      }

      return {
        onTransportConnected:onTransportConnected.bind(channel),
        onTransportStopping:onTransportStopping.bind(channel)
      };

    })(this);

    privateParts.set(this, privatePart); // This would bind 'this' object with the privatePart.

    channels.Channel.prototype.setTransport = function(transport){
      this.transport = transport;

      // This remove and add is important to avoid multiple event firing.
      this.transport.removeListener(transports.Transport.Events.Connected, privateParts.get(this).onTransportConnected);
      this.transport.on(transports.Transport.Events.Connected, privateParts.get(this).onTransportConnected);

      this.transport.removeListener(items.DynamicItem.Events.Stopping, privateParts.get(this).onTransportStopping);
      this.transport.on(items.DynamicItem.Events.Stopping, privateParts.get(this).onTransportStopping);

      console.log('Transport set to %s', transport.id);
    };

    channels.Channel.prototype.startSubscriptions = function(transportData){
      if(!this.doStartSubscriptions){
        throw new messages.DialToneError('doStartSubscriptions is not implemented by ' + this.id);
      }
      this.doStartSubscriptions(transportData);
    };
    channels.Channel.prototype.stopSubscriptions = function(){
      if(!this.doStopSubscriptions){
        throw new messages.DialToneError('doStopSubscriptions is not implemented by ' + this.id);
      }
      this.doStopSubscriptions();
    };

    channels.Channel.prototype.doStart = function(){
      if(!this.transport){
        throw new messages.DialToneError('No transport set');
      }
      this.transport.start();
    };

    channels.Channel.prototype.send = function(message){
      if(!this.transport){
        throw new messages.DialToneError('No transport set');
      }
      this.transport.send(message);
    };


  };

  methods.inherit(channels.Channel, items.DynamicItem);

  channels.Channel.Events = (function(){
    return {
      Connected: 'Connected',
      Disconnected: 'Disconnected',
      MessageReceived: 'MessageReceived'
    };
  })();

})();


;(function(){
  'use strict';

  var transports = jsdialtone.namespace('transports');
  var http = jsdialtone.namespace('transports.http');
  var methods = jsdialtone.namespace('utilities.methods');
  var messages = jsdialtone.namespace('common.messages');
  var channels = jsdialtone.namespace('channels');
  var httpChannels = jsdialtone.namespace('channels.http');

  var privateParts = new WeakMap();

  httpChannels.HttpChannel = function(id){

    this.hashCode = Math.random();
    channels.Channel.call(this, id);

    httpChannels.HttpChannel.prototype.onMessageReceived = function(response){
      var args = new messages.EventArgs();
      args.name = channels.Channel.Events.MessageReceived;
      args.eventData = response;
      this.emit(channels.Channel.Events.MessageReceived, args);
    };

    httpChannels.HttpChannel.prototype.setTopics = function(topics){
      // No topics involved here.
    };

    httpChannels.HttpChannel.prototype.isValid = function(){
      return this.transport !== null;
    };

    httpChannels.HttpChannel.prototype.doStart = function() {

      if(!this.isValid()) {
        console.log('Unable to start channel %s', this.id);
      }

      this.transport.start();

    };

    this.doStop = function(){
      console.log('doStop: Nothing to do here.');
    };

    this.doStartSubscriptions = function(transportData){
      console.log('doStartSubscriptions: Nothing to do here.');
    };

    this.doStopSubscriptions = function(){
      console.log('doStopSubscriptions: Nothing to do here.');
    };

    httpChannels.HttpChannel.prototype.onDeserialization = function(settings){
      var promise = new Promise(onDeserialize(settings).bind(this));
      return promise;
    };

    this.send = function(message){
      if(!this.transport){
        throw new messages.DialToneError('No transport set');
      }
      //this.transport.send(message, privateParts.get(this).onMessageReceived);
      this.transport.send(message, this.onMessageReceived.bind(this));
    };

    function onDeserialize(settings){

      return function(resolve, reject){
        try{
          var des = jsdialtone.namespace('deserialization');
          des.objectFactory.instance.createFromReference(settings.TransportId)
            .then(function(transport){
              try{
                this.setTransport(transport);
                resolve(this);
              }
              catch(er){
                reject(er);
              }
            }.bind(this),
            function(error){
              reject(error);
            });
        }
        catch(error){
          reject(error);
        }
      };

    }



  };
  methods.inherit(httpChannels.HttpChannel, channels.Channel);
})();








;(function(){
  'use strict';

  var decoders = jsdialtone.namespace('decoders');
  var messages = jsdialtone.namespace('common.messages');

  decoders.Decoder = function(){

    this.dataObject = null;
    _.extend(this, new EventEmitter());

    decoders.Decoder.prototype.decodeMessage = function(e){

      var serverResponse = e.eventData;
      var type = serverResponse.type;
      var dataObject = serverResponse.content;
      if(!dataObject || !type){
        console.log('No type property received in response.');
        return;
      }
      switch(type){
        case messages.ServerMessageType.Supply:
          if(!this.doDecodeSupplyMessage){
            throw new messages.DialToneError('%s does not implement doDecodeSupplyMessage', this);
          }
          this.doDecodeSupplyMessage(serverResponse);
          break;
        case messages.ServerMessageType.Insert:
          if(!this.doDecodeInserts){
            throw new messages.DialToneError('%s does not implement doDecodeInserts', this);
          }
          this.doDecodeInserts(serverResponse);
          break;
        case messages.ServerMessageType.Update:
          if(!this.doDecodeUpdates){
            throw new messages.DialToneError('%s does not implement doDecodeUpdates', this);
          }
          this.doDecodeUpdates(serverResponse);
          break;
        case messages.ServerMessageType.Delete:
          if(!this.doDecodeDeletes){
            throw new messages.DialToneError('%s does not implement doDecodeDeletes', this);
          }
          this.doDecodeDeletes(serverResponse);
          break;
        case messages.ServerMessageType.Error:
          throw new messages.DialToneError(dataObject);
        default:
          console.log('Invalid message type received.');
          break;
      }

    }.bind(this);


  };

  decoders.Decoder.Events = (function(){
    return {
      ObjectSupplied: 'ObjectSupplied',
      ObjectChanged: 'ObjectChanged',
      OnError: 'OnError'
    };
  })();
})();
;(function(){
  'use strict';

  var decoders = jsdialtone.namespace('decoders');
  var defaultDec = jsdialtone.namespace('decoders.default');
  var methods = jsdialtone.namespace('utilities.methods');

  defaultDec.DefaultDataDecoder = function(){

    decoders.Decoder.call(this);
    this.dataObject = null;
    _.extend(this, new EventEmitter());

    defaultDec.DefaultDataDecoder.prototype.doDecodeSupplyMessage = function(serverResponse){

      var decodedObject = this.processSupply(serverResponse.content);
      var message = new jsdialtone.common.messages.EventArgs(decoders.Decoder.Events.ObjectSupplied,
        decodedObject);
      console.log('supply decoding complete.');
      this.emit(decoders.Decoder.Events.ObjectSupplied, message);

    };

    defaultDec.DefaultDataDecoder.prototype.doDecodeInserts = function(serverResponse){

      var decodedObject = this.processInserts(serverResponse.content);
      var message = new jsdialtone.common.messages.EventArgs(decoders.Decoder.Events.ObjectChanged,
        decodedObject);
      this.emit(decoders.Decoder.Events.ObjectChanged, message);
    };

    defaultDec.DefaultDataDecoder.prototype.doDecodeUpdates = function(serverResponse){

      var decodedObject = this.processUpdates(serverResponse.content);
      var message = new jsdialtone.common.messages.EventArgs(decoders.Decoder.Events.ObjectChanged,
        decodedObject);
      this.emit(decoders.Decoder.Events.ObjectChanged, message);
    };

    defaultDec.DefaultDataDecoder.prototype.doDecodeDeletes = function(serverResponse){

      var decodedObject = this.processDeletes(serverResponse.content);
      var message = new jsdialtone.common.messages.EventArgs(decoders.Decoder.Events.ObjectChanged,
        decodedObject);
      this.emit(decoders.Decoder.Events.ObjectChanged, message);
    };

    defaultDec.DefaultDataDecoder.prototype.processSupply = function(suppliedObject){

      var table = new jsdialtone.dataObjects.DataTable(suppliedObject.columnCfg);
      table.setRows(suppliedObject.rows);
      this.dataObject = table;
      return jsdialtone.common.messages.GetSupplyObject(suppliedObject);
    };

    defaultDec.DefaultDataDecoder.prototype.processInserts = function(insertObject){

      this.validateSuppliedObject();
      if(!insertObject.rows){
        console.log('No rows property available on insertObjectl');
        return;
      }
      var table = this.dataObject;
      _.each(insertObject.rows, function(row){table.addRow(row);});
      return jsdialtone.common.messages.GetInsertObject(insertObject.rows);
    };

    defaultDec.DefaultDataDecoder.prototype.processUpdates = function(updateObject){

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

    defaultDec.DefaultDataDecoder.prototype.processDeletes = function(deleteObject){

      this.validateSuppliedObject();
      if(!deleteObject.rowKeys){
        console.log('No rowKeys property available on deleteObject');
        return;
      }
      var table = this.dataObject;
      _.each(deleteObject.rowKeys, function(rowKey){table.removeRow(rowKey);});
      return jsdialtone.common.messages.GetDeleteObject(deleteObject.rowKeys);
    };

    defaultDec.DefaultDataDecoder.prototype.validateSuppliedObject = function(){
      if(!this.dataObject){
        var e = new jsdialtone.common.message.DialToneError();
        e.message = 'No dataobject supplied.';
        throw e;
      }
    };

  };

  methods.inherit(defaultDec.DefaultDataDecoder, decoders.Decoder);
})();



;(function(){
  'use strict';
  var actions = jsdialtone.namespace('providers.remote.actions');
  var channels = jsdialtone.namespace('channels');

  actions.DefaultQueryAction = function(){

    this.queryChannel = null;
    this.dataDefinition = null;
    this.subject = null;
    this.decoder = null;

    _.extend(this, new EventEmitter());
    this.hashCode = Math.random();
    //console.log('Creating QueryAction %s', this.hashCode);

    actions.DefaultQueryAction.prototype.execute = function(){

      //console.log('Sending on QueryAction %s', this.hashCode);
      var r = new jsdialtone.common.messages.Message();
      r.topic = this.subject;
      r.content = this.dataDefinition;
      this.queryChannel.send(r);

    };

    actions.DefaultQueryAction.prototype.start = function(){
      if(!this.decoder){
        throw new jsdialtone.common.messages.DialToneError('No decoder set.');
      }
      this.decoder.removeListener(jsdialtone.decoders.Decoder.Events.ObjectSupplied, this.onSupplied);
      this.decoder.on(jsdialtone.decoders.Decoder.Events.ObjectSupplied, this.onSupplied);
      this.decoder.removeListener(jsdialtone.decoders.Decoder.Events.OnError, this.onError);
      this.decoder.on(jsdialtone.decoders.Decoder.Events.OnError, this.onError);
      this.queryChannel.removeListener(channels.Channel.Events.MessageReceived, this.channelMessageReceived);
      this.queryChannel.on(channels.Channel.Events.MessageReceived, this.channelMessageReceived);
      this.queryChannel.start();
    };

    actions.DefaultQueryAction.prototype.stop = function(){
      this.queryChannel.stop();
    };

    this.channelMessageReceived = function(m){
      this.decoder.decodeMessage(m);
    }.bind(this);

    this.onSupplied = function(e){
      var message = new jsdialtone.common.messages.EventArgs(
        actions.DefaultQueryAction.Events.QueryComplete,
        e.eventData);
      this.emit(actions.DefaultQueryAction.Events.QueryComplete, message);
    }.bind(this);

    this.onError = function(e){
      var message = new jsdialtone.common.messages.EventArgs(
        actions.DefaultQueryAction.Events.QueryFailed,
        e.eventData);
      this.emit(actions.DefaultQueryAction.Events.QueryFailed, message);
    }.bind(this);

    actions.DefaultQueryAction.prototype.onDeserialization = function(settings){
      var promise = new Promise(onDeserialize(settings).bind(this));
      return promise;
    };

    function onDeserialize(settings){

      return function(resolve, reject){
        try{
          var des = jsdialtone.namespace('deserialization');
          this.dataDefinition = settings.DataDefinition;
          this.subject = settings.QuerySubject;
          this.decoder = jsdialtone.create(settings.DataDecoder.Type);
          var cSetting = settings.QueryChannel.Channel;
          des.objectFactory.instance.createFromSettings(cSetting).then(function(c){
            this.queryChannel = c;
            resolve(this);
          }.bind(this),function(error){
            reject(error);
          });
        }
        catch(error){
          reject(error);
        }
      };

    }
  };
  actions.DefaultQueryAction.Events = (function(){

    return {
      QueryComplete: 'QueryComplete',
      QueryFailed: 'QueryFailed'
    };

  })();
})();

;(function(){
  'use strict';

  var actions = jsdialtone.namespace('providers.remote.actions');
  var channels = jsdialtone.namespace('channels');
  var messages = jsdialtone.namespace('common.messages');

  actions.DefaultSubscribeAction = function(){

    this.channels = [];
    this.decoder = null;
    _.extend(this, new EventEmitter());
    var self = this;

    var local = (function(actionInstance){

      var action = actionInstance;

      function listenChannel(channel){

        if(!channel){
          throw {Message: 'channel is undefined'};
        }
        if(!channel.isValid()){
          throw {Message: 'channel is invalid'};
        }
        channel.removeListener(channels.Channel.Events.Connected, channelConnected);
        channel.on(channels.Channel.Events.Connected, channelConnected);
        channel.removeListener(channels.Channel.Events.Disconnected, channelDisconnected);
        channel.on(channels.Channel.Events.Disconnected, channelDisconnected);
        channel.removeListener(channels.Channel.Events.MessageReceived, channelMessageReceived);
        channel.on(channels.Channel.Events.MessageReceived, channelMessageReceived);

      }

      function channelConnected(e)
      {
        action.emit(actions.DefaultSubscribeAction.Events.ChannelConnected, e);
      }

      function channelDisconnected(e)
      {
        action.emit(actions.DefaultSubscribeAction.Events.ChannelDisconnected, e);
      }

      function channelMessageReceived(e){
        action.decode(e);
      }

      return {
        listenChannel: listenChannel
      };

    })();

    actions.DefaultSubscribeAction.prototype.addChannel = function(channel){

      local.listenChannel(channel);
      self.channels.push(channel);
    };

    actions.DefaultSubscribeAction.prototype.start = function(){

      if(!self.decoder){
        throw new jsdialtone.common.messages.DialToneError('No decoder set.');
      }
      self.decoder.removeListener(jsdialtone.decoders.Decoder.Events.ObjectSupplied, self.onSupplied);
      self.decoder.on(jsdialtone.decoders.Decoder.Events.ObjectSupplied, self.onSupplied);
      self.decoder.removeListener(jsdialtone.decoders.Decoder.Events.ObjectChanged, self.onChange);
      self.decoder.on(jsdialtone.decoders.Decoder.Events.ObjectChanged, self.onChange);
      for(var i=0;i<self.channels.length;i++){
        self.channels[i].start();
        //c.start();
      }
    };

    this.onSupplied = function(e){
      var message = new jsdialtone.common.messages.EventArgs(actions.DefaultSubscribeAction.Events.ObjectSupplied,
        e.eventData);
      self.emit(actions.DefaultSubscribeAction.Events.ObjectSupplied, message);
    };

    this.onChange = function(e){
      var message = new jsdialtone.common.messages.EventArgs(actions.DefaultSubscribeAction.Events.ObjectChanged,
        e.eventData);
      self.emit(actions.DefaultSubscribeAction.Events.ObjectChanged, message);
    };

    actions.DefaultSubscribeAction.prototype.stop = function(){
      for(var i=0;i<self.channels.length;i++){
        var c= self.channels[i];
        c.stop();
      }
    };

    actions.DefaultSubscribeAction.prototype.decode = function(message){
      if(!self.decoder){
        throw new messages.DialToneError('No decoder supplied.');
      }
      self.decoder.decodeMessage(message);

    };

    actions.DefaultSubscribeAction.prototype.onDeserialization = function(settings){
      var des = jsdialtone.namespace('deserialization');
      var p = new Promise(function(resolve, reject){
        var subAction= jsdialtone.create(settings.Type);
        subAction.decoder = jsdialtone.create(settings.DataDecoder.Type);
        var channelPromises = [];
        var type = Object.prototype.toString.call(settings.SubscriptionChannels.Channel);
        if(type === '[object Array]'){
          for(var i=0;i < settings.SubscriptionChannels.Channel.length; i++){
            var cSetting = settings.SubscriptionChannels.Channel[i];
            channelPromises.push(des.objectFactory.instance.createFromSettings(cSetting));
          }
        }
        else{
          var cSetting1 = settings.SubscriptionChannels.Channel;
          channelPromises.push(des.objectFactory.instance.createFromSettings(cSetting1));
        }

        Promise.all(channelPromises).then(function(channels){
          _.each(channels, function(c){subAction.addChannel(c);});
          resolve(subAction);

        }, function(error){
          reject(error);
        });
      });
      return p;
    };

  };

  actions.DefaultSubscribeAction.Events = (function(){

    return {
      ChannelConnected: 'ChannelConnected',
      ChannelDisconnected: 'ChannelDisconnected',
      ObjectSupplied: 'ObjectSupplied',
      ObjectChanged: 'ObjectChanged'
    };

  })();

})();


;(function(){
  'use strict';

  var items = jsdialtone.namespace('common.items');
  var methods = jsdialtone.namespace('utilities.methods');
  var messages = jsdialtone.namespace('common.messages');
  var providers = jsdialtone.namespace('providers');

  /**
   * DataProvider provides a way to supply data in a DataTable(rows/columns) format. Clients need to
   * provide handlers for 'onSupply' and 'onError' events that are fired from this class.
   *

   * @class DataProvider
   * @memberof jsdialtone.providers
   */
  providers.DataProvider = function(id){

    items.DynamicItem.call(this, id);
    _.extend(this, new EventEmitter());

    this.initialized = false;

    /** This is the actual DataTable instance that is created from the response of the server.
     * @property dataSource
     * @memberof jsdialtone.providers.DataProvider
     */
    this.dataSource = null;

    /**
     * Called whenever a supply response is received from the underlying decoder. This typically would happen
     * in case of the a provider starting for first time, or a restart.
     * @memberof jsdialtone.providers.DataProvider
     * @function notifySupply
     * @param supplyObject An instance of DataTable that contains the decoded response from server.
     */
    providers.DataProvider.prototype.notifySupply = function(supplyObject){

      var dataObject = jsdialtone.dataObjects.DataTableManager.getDataTable(supplyObject.decodedObject);
      this.dataSource = dataObject;
      console.log('About to notify supply...');
      //_.each(this.clients, function(c){
      //    c.onSupply(this.dataSource);
      //});
      var message = new jsdialtone.common.messages.EventArgs
      (providers.DataProvider.Events.OnSupply,
        this.dataSource);
      this.emit(providers.DataProvider.Events.OnSupply, message);
    };

    /**
     * Called in case some error occurred while decoding response, or an error was sent from the server itself.
     * @memberof jsdialtone.providers.DataProvider
     * @function notifyError
     * @param error Contains the error details.
     */
    providers.DataProvider.prototype.notifyError = function(error) {

      //var this = privateParts.get(this).instance;
      console.log('About to notify error...');
      var message = new jsdialtone.common.messages.EventArgs
      (providers.DataProvider.Events.OnError,
        error);
      this.emit(providers.DataProvider.Events.OnError, message);
    };

    /**
     * Called whenever a insert/update/delete is received from the underlying decoder.
     * @memberof jsdialtone.providers.DataProvider
     * @function notifyChanges
     * @param changeObject An instance of DataTable that contains the decoded response from server. The DataTable
     * consists of insert/update/delete objects that can be checked for changes.
     */
    providers.DataProvider.prototype.notifyChanges = function(changeObject){

      var table = this.dataSource;
      switch(changeObject.changeType){
        case jsdialtone.common.messages.ChangeType.Insert:
          table.fastAddRows(changeObject.decodedObject);
          break;
        case jsdialtone.common.messages.ChangeType.Update:
          table.fastUpdateRows(changeObject.decodedObject);
          break;
        case jsdialtone.common.messages.ChangeType.Delete:
          table.fastDeleteRows(changeObject.decodedObject);
          break;
        default:
          console.log('Invalid change request received.');
          return;
      }

      var message = new jsdialtone.common.messages.EventArgs
      (providers.DataProvider.Events.OnChange,
        this.dataSource);
      this.emit(providers.DataProvider.Events.OnChange, message);
    };

  };

  methods.inherit(providers.DataProvider, items.DynamicItem);

  providers.DataProvider.Events = (function(){

    return {
      /**
       * @event OnSupply
       * @memberof jsdialtone.providers.DataProvider
       */
      OnSupply: 'OnSupply',
      OnChange: 'OnChange',
      OnError: 'OnError'
    };

  })();

})();
;(function(){
  'use strict';

  var providers = jsdialtone.namespace('providers');
  var methods = jsdialtone.namespace('utilities.methods');
  var remote = jsdialtone.namespace('providers.remote');
  var messages = jsdialtone.namespace('common.messages');
  var actions = jsdialtone.namespace('providers.remote.actions');
  var privateParts = new WeakMap();

  /**
   * RemoteDataProvider is an implementation of DataProvider that can supply data as a DataTable. This class
   * can be used to retrieve data from outside the application.

   * @class RemoteDataProvider
   * @memberof jsdialtone.providers.remote
   */
  remote.RemoteDataProvider = function(id){

    providers.DataProvider.call(this, id);
    //this.hashCode = Math.random();
    //console.log('Creating provider %s', this.hashCode);
    this.subscribeAction = null;
    /**
     * Holds the underlying query details that would be part of the request message sent to server.
     * @property queryAction
     * @memberof jsdialtone.providers.remote.RemoteDataProvider
     */
    this.queryAction = null;
    this.usesWorker = false;
    this.connected = false;
    this.workerPath = 'SubscribeActionWorker.js';

    var privatePart = (function(instance){
      var rdp = instance;

      function initActions(){

        if(rdp.initialized){
          return;
        }

        if(rdp.queryAction) {
          rdp.queryAction.on(actions.DefaultQueryAction.Events.QueryComplete, function (e) {

            var supplyObject = e.eventData;
            rdp.processSupply(supplyObject);
          });
          rdp.queryAction.on(actions.DefaultQueryAction.Events.QueryFailed, function (e) {

            var error = e.eventData;
            rdp.notifyError(error);
          });
        }

        if(rdp.subscribeAction) {
          rdp.subscribeAction.on(actions.DefaultSubscribeAction.Events.ChannelConnected, function (e) {

            if (rdp.connected) {
              return;
            }
            rdp.connected = true;
          });

          rdp.subscribeAction.on(actions.DefaultSubscribeAction.Events.ObjectSupplied, function (e) {

            var supplyObject = e.eventData;
            rdp.processSupply(supplyObject);
          });
          rdp.subscribeAction.on(actions.DefaultSubscribeAction.Events.ObjectChanged, function (e) {
            var changeObject = e.eventData;
            rdp.processChange(changeObject);

          });
        }

        rdp.initialized = true;
      }

      return {
        initActions: initActions
      };
    })(this);

    privateParts.set(this, privatePart);

    remote.RemoteDataProvider.prototype.init = function(settings){

      //var this = privateParts.get(this).instance;
      var initPromise = new Promise(function(resolve, reject){

        this.id = settings.Id;
        this.workerPath = settings.WorkerPath;
        if(typeof Worker === 'function') {
          {
            if(settings.UsesWorker && settings.UsesWorker === 'true'){
              this.usesWorker = true;
            }
            else{
              this.usesWorker = false;
            }

          }
        }
        else{
          this.usesWorker = false;
        }
        if(this.usesWorker){
          //TODO : This path needs to be revisited.
          this.subscribeAction = new Worker(this.workerPath);
          this.subscribeAction.addEventListener('message', function(e){

            var workerMessage = e.data;
            switch(workerMessage.command) {

              case 'INITIALIZED':
                this.initialized = true;
                resolve(this);
                return;
            }
            this.processMessage(e);
          });
          var initMessage = new messages.WorkerMessage();
          initMessage.command = 'INIT';
          initMessage.content = settings;
          this.subscribeAction.postMessage(initMessage);

        }
        else{
          var des = jsdialtone.namespace('deserialization');
          des.objectFactory.instance.createFromSettings(settings.QueryAction).
            then(function(qAction){
              this.queryAction = qAction;
              if(settings.SubscribeAction) {
                return des.objectFactory.instance.createFromSettings(settings.SubscribeAction);
              }
              else{
                return null;
              }
            }.bind(this),
            function(error){
              reject(error);
            }).
            then(function(subAction){
              this.subscribeAction = subAction;
              privateParts.get(this).initActions();
              resolve(this);
            }.bind(this),
            function(error){
              reject(error);
            });
        }

      }.bind(this));
      return initPromise;

    };

    remote.RemoteDataProvider.prototype.initialize = function(){
      privateParts.get(this).initActions();
    };
    /**
     * Starts the provider. If a queryAction is specified, it is started as part of this.
     * @function doStart
     * @memberof jsdialtone.providers.remote.RemoteDataProvider
     */
    remote.RemoteDataProvider.prototype.doStart = function(){

      //var this = privateParts.get(this).instance;
      if(!this.initialized){
        this.initActions(this.usesWorker);
      }

      if(this.usesWorker) {
        var startMessage = new jsdialtone.common.messages.WorkerMessage();
        startMessage.command = 'START';
        this.subscribeAction.postMessage(startMessage);
      }
      else{

        if(this.subscribeAction) {
          this.subscribeAction.start();
        }
        if(this.queryAction) {
          this.queryAction.start();
          this.queryAction.execute();
        }
      }

    };

    /**
     * Stops the provider. Removes the underlying subscriptions of channels, if any.
     * @function doStop
     * @memberof jsdialtone.providers.remote.RemoteDataProvider
     */
    remote.RemoteDataProvider.prototype.doStop = function(){

      //var this = privateParts.get(this).instance;
      if(this.usesWorker) {
        if(this.subscribeAction) {
          this.subscribeAction.terminate();
        }
      }
      else{
        if(this.subscribeAction) {
          this.subscribeAction.stop();
        }
      }
      this.connected = false;
    };


    remote.RemoteDataProvider.prototype.processMessage = function(e){

      //var this = privateParts.get(this).instance;
      var workerMessage = e.data;

      switch(workerMessage.command){

        case 'INITIALIZED':
          this.initialized = true;
          break;

        case 'CHANNELCONNECTED':

          if(this.connected) {
            return;
          }
          this.connected = true;
          break;
        case 'SUPPLY':
          console.log('Received supply on main thread.');
          var supplyObject = workerMessage.content;
          this.processSupply(supplyObject);

          break;
        case 'CHANGE':

          var changeObject = workerMessage.content;
          this.processChange(changeObject);
          break;
      }

    };

    /**
     * Sends the received object for supply notification to clients.
     * @function processSupply
     * @memberof jsdialtone.providers.remote.RemoteDataProvider
     */
    remote.RemoteDataProvider.prototype.processSupply = function(supplyObject){

      this.notifySupply(supplyObject);
    };

    /**
     * Sends the received object for change notification to clients. The argument changeObject holds the complete
     * DataTable, that has all the details to find the changes occured.
     * @function processChange
     * @memberof jsdialtone.providers.remote.RemoteDataProvider
     */
    remote.RemoteDataProvider.prototype.processChange = function(changeObject){

      //var this = privateParts.get(this).instance;
      this.notifyChanges(changeObject);
    };

    /**
     * Called when an instance needs to be created from existing settings. This method is called as part of
     * initialization of the objects by objectFactory.
     * @function onDeserialization
     * @memberof jsdialtone.providers.remote.RemoteDataProvider
     * @param settings These are retrieved from FID Config as part of start up.
     * @returns {Promise}
     */
    remote.RemoteDataProvider.prototype.onDeserialization = function(settings){
      var promise = new Promise(onDeserialize(settings).bind(this));
      return promise;
    };

    function onDeserialize(settings){

      return function(resolve, reject){
        try{
          this.init(settings).then(
            function(){
              resolve(this);
            }.bind(this),
            function(error){
              reject(error);
            });
        }
        catch(error){
          reject(error);
        }
      };
    }

  };

  methods.inherit(remote.RemoteDataProvider, providers.DataProvider);

})();
;(function(){
  'use strict';

  var des = jsdialtone.namespace('deserialization');
  des.objectFactory = (function() {

    var reg = new RegExp('%', 'g');
    var requestString = 'ElementConfig';
    var singleton;

    function createFromSettings(settings){

      var createPromise = new Promise(function(resolve, reject){
        if(!settings.Type){
          reject(new Error('No type supplied.'));
          return;
        }
        var instance = jsdialtone.create(settings.Type);
        if(instance.onDeserialization){
          instance.onDeserialization(settings).then(
            function(deserializedInstance){
              resolve(deserializedInstance);
            },
            function(error){
              reject(error);
            });
        }
      });
      return createPromise;
    }

    function createFromReference(id, category){

      if(!singleton.objectCache){
        singleton.objectCache = {};
      }
      var createReferencePromise = new Promise(function(resolve, reject){

        if(!id){
          reject(new Error('No id supplied.'));
          return;
        }
        var itemId = id.replace(reg,'');
        if(_.has(singleton.objectCache, itemId)){
          resolve(singleton.objectCache[itemId]);
          return;
        }

        var elemCategory = 'Web';
        if(category){
          elemCategory = category;
        }
        var request = {
          TypeName: requestString,
          Data: {
            id: itemId,
            category: elemCategory
          }
        };
        jsdialtone.configservice.getConfig(request).then(function (config) {

          if(_.has(singleton.objectCache, itemId)){
            resolve(singleton.objectCache[itemId]);
            return;
          }
          createFromSettings(config.Settings).then(function(instance){
              var toBeResolvedInstance = instance;
              if(_.has(singleton.objectCache, itemId)){
                toBeResolvedInstance = singleton.objectCache[itemId];
              }
              else{
                singleton.objectCache[itemId] = instance;
              }

              resolve(toBeResolvedInstance);
              //singleton.objectCache[itemId] = instance;
              //resolve(instance);
            },
            function(error){
              reject(error);
            });
        });

      });
      return createReferencePromise;

    }


    function init(){

      if(!singleton){
        singleton = {

          createFromReference : createFromReference,
          createFromSettings: createFromSettings
        };
      }
      return singleton;
    }

    return {
      instance: init()
    };

  })();
})();
