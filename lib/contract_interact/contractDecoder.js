"use strict";
/**
 * File to decode the transfer event logs from the LogsArray provided
 *
 * @module lib/contract_interact/contractDecoder
 */
// Load external libraries

// Load internal files
const rootPrefix = '../..'
  , coreAbi = require(rootPrefix + '/config/core_abis')
  , abiDecoder = require('abi-decoder')
;

// Initialize decoder with abi.
abiDecoder.addABI(coreAbi.getInstance().getERC20TokenABI());
abiDecoder.addABI(coreAbi.getInstance().getOpenSTUtilityABI());
abiDecoder.addABI(coreAbi.getInstance().getAirDropABI());

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
    console.log("Decoding decodeTransactionsFromLogs");
    const decodeEvents = abiDecoder.decodeLogs(logsArray);

    //console.debug("Decoded Events ", JSON.stringify(decodeEvents));
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
  },

  /**
   * Decode event logs from the LogsArray provided
   *
   * @param  {Array} logsArray - logs array of the transactions receipt
   * @return {Array} - Hash of all the events in the log
   */
  decodeLogs: function (logsArray) {
    console.log("Decoding decodeLogs");
    const decodeEvents = abiDecoder.decodeLogs(logsArray);

    //console.debug("Decoded Events ", JSON.stringify(decodeEvents));
    // Decode Transaction from event
    var eventArray = [];

    for (var eventIndex in decodeEvents) {
      var decodedEvent = decodeEvents[eventIndex];
      if (decodedEvent != undefined) {

        if (decodedEvent.name == 'RegisteredBrandedToken') {
          var event = {};
          event.address = decodedEvent.address;
          var events = decodedEvent.events;

          for (var ind in events) {
            event[events[ind].name] = events[ind].value;
          }
          event.eventName = 'RegisteredBrandedToken';
          eventArray.push(event);
        }
      }
    }
    return eventArray;
  },

  decodeMethodFromInputData: function (inputData) {
    console.log("inputData ----", inputData.toString());
    const decodedMethod = abiDecoder.decodeMethod(inputData.toString());
    console.log("******* decodedMethod ::", decodedMethod);

    if (decodedMethod){
      return JSON.stringify(decodedMethod, null, 4);
    }else{
      return inputData.toString();
    }

  }
};


module.exports = new ERC20TokenContractInteract();