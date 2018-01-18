"use strict";

const BigNumber = require('bignumber.js');

const rootPrefix = '../..'
  , coreAbi = require(rootPrefix+'/config/core_abis')
  , responseHelper = require(rootPrefix+'/lib/formatter/response')
  , abiDecoder = require('abi-decoder')
;

// Intialize decoder with abi.
abiDecoder.addABI(coreAbi.getInstance().getABI());

const erc20TokenContractInteract = {
	decodeTransactionsFromLogs: function (logsArray) {
    const decodeEvents = abiDecoder.decodeLogs(logsArray);

    console.log("Decoded Events ", decodeEvents);
    // Decode Transaction from event
    var transferEventsArray = [];
  
    for (var eventIndex in decodeEvents) {
      var decodeEvent = decodeEvents[eventIndex];
      if (decodeEvent != undefined) {

          if (decodeEvent.name == 'Transfer') {
              var transferEvent = {};
              transferEvent.address = decodeEvent.address;
              var events = decodeEvent.events;
            
              for (var event in events) {
                transferEvent[events[event].name] = events[event].value;
              }

              transferEventsArray.push(transferEvent);
          }
      }
    }
    return transferEventsArray;
  }  
}

module.exports = erc20TokenContractInteract;