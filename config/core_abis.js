"use strict";

/*
 * Load all contract abi files
 *
 */

const fs = require('fs')
  , path = require('path')
;

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || "utf8");
  return JSON.parse(fileContent);
}

const rootPrefix = "../contracts/abi/";
const rootPostfix = ".abi"


function CoreAbis() {
  this.abiHash = {};
  var jsonFile = parseFile('../contract_config.json',"utf8");

    for (var i = 0; i < jsonFile.length; i++) {
       
      var value = jsonFile[i];
      this.abiHash[value] =  parseFile(rootPrefix + value + rootPostfix, "utf8");
    }

}


CoreAbis.prototype = {
    getABI: function(name){
      console.log("********* 3.getABI : "+name);
      return this.abiHash[name];
    }

    ,getJSONFile: function(fileName){
      return parseFile('../'+fileName,"utf8")
    }
}



const coreContract = (function(){
    var instance;

    function createInstance() {
        var object = new CoreAbis();
        return object;
    }

    return {
      getInstance: function () {
          if (!instance) {
              instance = createInstance();
          }
          return instance;
      }
    };

})();

module.exports = coreContract;
