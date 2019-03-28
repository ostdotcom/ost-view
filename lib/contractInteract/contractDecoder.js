'use strict';
/**
 * File to decode the transfer event logs from the LogsArray provided
 *
 * @module lib/contract_interact/contractDecoder
 */
// Load external libraries
const brandedToken = require('@openst/brandedtoken.js'),
  openSt = require('@openst/openst.js'),
  mosaic = require('@openst/mosaic.js'),
  abiDecoder = require('abi-decoder');

// Load internal files
const rootPrefix = '../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const brandedTokenAbiBinProvider = new brandedToken.AbiBinProvider(),
  openStAbiBinProvider = new openSt.AbiBinProvider(),
  mosaicAbiBinProvider = new mosaic.AbiBinProvider();

// Initialize decoder needed ABIs
const abiList = [
  brandedTokenAbiBinProvider.getABI('UtilityBrandedToken'),
  openStAbiBinProvider.getABI('DelayedRecoveryModule'),
  openStAbiBinProvider.getABI('TokenHolder'),
  openStAbiBinProvider.getABI('GnosisSafe'),
  openStAbiBinProvider.getABI('TokenRules'),
  openStAbiBinProvider.getABI('PricerRule'),
  mosaicAbiBinProvider.getABI('EIP20Gateway'),
  mosaicAbiBinProvider.getABI('EIP20CoGateway'),
  mosaicAbiBinProvider.getABI('Anchor')
];
abiList.forEach((abi) => abiDecoder.addABI(abi));

class ERC20TokenContractInteract {
  /**
   * Contract interact for generic ERC20 contract
   *
   * @constructor
   */
  constructor() {}

  /**
   * Decode the transfer event logs from the LogsArray provided
   *
   * @param  {Array} logsArray - logs array of the transactions receipt
   * @return {Array} - Array of all the transfer events in the log
   */
  decodeTransactionsFromLogs(logsArray) {
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
  }

  /**
   * Decode event logs from the LogsArray provided
   *
   * @param  {Array} logsArray - logs array of the transactions receipt
   * @return {Hash} - Hash of all the events in the log
   */
  decodeLogs(logsArray) {
    const decodeEvents = abiDecoder.decodeLogs(logsArray);

    //console.debug("Decoded Events ", JSON.stringify(decodeEvents));
    // Decode Transaction from event
    const eventHash = {};
    for (let eventIndex in decodeEvents) {
      try {
        const decodedEvent = decodeEvents[eventIndex];
        const event = {};
        event.address = decodedEvent.address.toLowerCase();
        const events = decodedEvent.events;

        for (let ind in events) {
          event[events[ind].name] = events[ind].value.toLowerCase();
        }
        eventHash[decodedEvent.name] || (eventHash[decodedEvent.name] = []);
        eventHash[decodedEvent.name].push(event);
      } catch (err) {
        //Error because of some undefined event
        logger.error('contractDecoder :: decodeLogs :: try catch ', err);
      }
    }
    return eventHash;
  }

  decodeMethodFromInputData(inputData) {
    if (inputData) {
      const decodedMethod = abiDecoder.decodeMethod(inputData.toString());

      if (decodedMethod) {
        return JSON.stringify(decodedMethod, null, 4);
      } else {
        return inputData;
      }
    } else {
      return '';
    }
  }
}

module.exports = new ERC20TokenContractInteract();

/*
  const ErcToken = require('./lib/contract_interact/contractDecoder.js');
  ErcToken.decodeLogs();
 */
