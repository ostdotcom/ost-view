"use strict";
/**
 * Load all contract abi files
 */

// Load external libraries
const fs = require('fs')
  , path = require('path')
;

const rootPrefix = "..";

// Parse ABI files
function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || "utf8");
  return JSON.parse(fileContent);
}

/**
 * Load all required ABI files, listed in "jsonFile" variable
 */
function CoreAbis() {
  this.abiHash = {};
  var jsonFile = ['ERC20Token'];

  for (var i = 0; i < jsonFile.length; i++) {

    var value = jsonFile[i];
    this.abiHash[value] = parseFile(rootPrefix + "/contracts/abi/" + value + ".abi", "utf8");
  }

}

CoreAbis.prototype = {
  getABI: function () {
    return this.abiHash['ERC20Token'];
  }
}

/**
 * coreContract
 * Create Single Instance of coreContract.
 * @return {[function]}
 */
const coreContract = (function () {
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
