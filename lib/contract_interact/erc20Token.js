"use strict";
/**
 * File to decode the transfer event logs from the LogsArray provided
 *
 * @module lib/contract_interact/erc20Token
 */
// Load external libraries
const BigNumber = require('bignumber.js');

// Load internal files
const rootPrefix = '../..'
  , coreAbi = require(rootPrefix + '/config/core_abis')
  , abiDecoder = require('abi-decoder')
;

// Initialize decoder with abi.
abiDecoder.addABI(coreAbi.getInstance().getABI());

/**
 * Contract interact for generic ERC20 contract
 *
 * @constructor
 */
const ERC20TokenContractInteract = function (){};

ERC20TokenContractInteract.prototype = {

  /**
   * Decode the transfer event logs from the LogsArray provided
   *
   * @param  {Array} logsArray - logs array of the transactions receipt
   * @return {Array} - Array of all the transfer events in the log
   */
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

module.exports = new ERC20TokenContractInteract();