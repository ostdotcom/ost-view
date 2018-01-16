"use strict";

/**
 * List of all addresses and there respective abi, bin, passphrase
 * required for platform.
 *
 * And helper methods to access this information using human readable
 * names.
 *
 */

const relPath = ".."
  , coreAbis = require('./core_abis')
 // , coreBins = require('./core_bins')
;

var simpleTokenAbi, simpleTokenAddr;

if (process.env.USE_MOCK_SIMPLE_TOKEN != 1) {
  console.log("Using Original Simple Token Contract");
  simpleTokenAddr = process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR;
  simpleTokenAbi = coreAbis.simpleToken;
 // simpleTokenBin = coreBins.simpleToken;
} else {
  console.log("Using Mock Simple Token Contract");
  simpleTokenAddr = process.env.OST_SIMPLE_TOKEN_CONTRACT_ADDR;
  simpleTokenAbi = coreAbis.mockSimpleToken;
  //simpleTokenBin = coreBins.mockSimpleToken;
}


var contracts = {}

var contractConfigJSON = ['ERC20Token'];

var coreAbiInstance = coreAbis.getInstance();

for (var i = 0; i < contractConfigJSON.length; i++) {
  var contractName = contractConfigJSON[i];
  var contractAddress = 'OSTE_CONTRACT_'+contractName.toUpperCase()+'_ADDR';

  contracts[contractName] = {
    address : process.env[contractAddress],
    abi : coreAbiInstance.getABI(contractName)
  }
}  


// generate a contract address to name map for reverse lookup
const addrToContractNameMap = {};
for (var contractName in contracts) {
  var addr = contracts[contractName].address;

  if ( Array.isArray(addr) ) {
    for (var i = 0; i < addr.length; i++) {
      addrToContractNameMap[addr[i].toLowerCase()] = contractName;
    }
  } else if ( addr !== null && typeof addr !== "undefined") {
    addrToContractNameMap[addr.toLowerCase()] = contractName;
  }
}

// helper methods to access difference addresses and their respective details
const coreAddresses = {
  getAddressForUser: function(userName) {
    return users[userName].address;
  },

  getPassphraseForUser: function(userName) {
    return users[userName].passphrase;
  },

  getAddressForContract: function(contractName) {
    var contractAddress = contracts[contractName].address;
    if (Array.isArray(contractAddress)) {
      throw "Please pass valid contractName to get contract address for: "+contractName;
    }
    return contractAddress;
  },

  // This must return array of addresses.
  getAddressesForContract: function(contractName) {

    var contractAddresses = contracts[contractName].address;
    if (!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length===0) {
      throw "Please pass valid contractName to get contract address for: "+contractName;
    }
    return contractAddresses;
  },

  getContractNameFor: function(contractAddr) {
    return addrToContractNameMap[(contractAddr || '').toLowerCase()];
  },

  getAbiForContract: function(contractName) {
    return contracts[contractName].abi;
  },

  getBinForContract: function(contractName) {
    return contracts[contractName].bin;
  }
};

module.exports = coreAddresses;

