"use strict";
/**
 * File to decode the transfer event logs from the LogsArray provided
 *
 * @module lib/contract_interact/contractDecoder
 */
// Load external libraries
const BigNumber = require('bignumber.js');

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
      return decodedMethod["name"];
    }else{
      return "";
    }

  }
};

//[{"name":"RegisteredBrandedToken","events":[{"name":"_registrar","type":"address","value":"0xfa4ed2544b7fc19ceeea508295519ffb8e1d68fd"},{"name":"_token","type":"address","value":"0x787e135086a18d7061a4702f681a2693f38cbfae"},{"name":"_uuid","type":"bytes32","value":"0x36101e693f1f1b085bdd6e62a3f6ab1abb5843004e9f3cbea0ce3373641b3be2"},{"name":"_symbol","type":"string","value":"ACME"},{"name":"_name","type":"string","value":"ACME Coin"},{"name":"_conversionRate","type":"uint256","value":"10"},{"name":"_requester","type":"address","value":"0x55cacd2a601399228aab666c31bc683462b1be6c"}],"address":"0xb94B18fBCfEB0EF199bB47136D0891B1a50Ffe27"}]

module.exports = new ERC20TokenContractInteract();