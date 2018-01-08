"use strict";


const rootPrefix = '../..'
  , coreAddresses = require(rootPrefix+'/config/core_addresses')
  , web3EventsDecoder = require(rootPrefix+'/lib/web3/events/decoder')

;


const helper = {

	/**
   * Call methods (execute methods which DO NOT modify state of contracts)
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} currContractAddr - current contract address
   * @param {Object} encodeABI - encoded method ABI data
   * @param {Object} [options] - optional params
   * @param {Object} [transactionOutputs] - optional transactionOutputs
   *
   * @return {Promise}
   *
   */
  call: function (web3RpcProvider, currContractAddr, encodeABI, options, transactionOutputs) {
    var params = {
      to: currContractAddr,
      data: encodeABI
    };
    if (options) {
      Object.assign(params,options)
    }
 
    return web3RpcProvider.eth.call(params)
      .then(function(response){
           
          if ( transactionOutputs ) {
            return web3RpcProvider.eth.abi.decodeParameters(transactionOutputs, response);  
          } else {
            return response;
          }
      });
  },

  /**
   * get outputs of a given transaction
   *
   * @param {Object} transactionObject - transactionObject is returned from call method.
   *
   * @return {Object}
   *
   */
  getTransactionOutputs: function ( transactionObject ) {
    return transactionObject._method.outputs;
  },

	/**
   * Decode result and typecast it to an Address
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toAddress: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.eth.abi.decodeParameter('address', result));
    });
  },

  /**
   * Decode result and typecast it to a String
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toString: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.eth.abi.decodeParameter('bytes32', result));
    });
  },

  /**
   * Decode result and typecast it to a Number
   *
   * @param {Web3} web3RpcProvider - It could be value chain or utility chain provider
   * @param {String} result - current contract address
   *
   * @return {Promise}
   *
   */
  toNumber: function (web3RpcProvider, result) {
    return new Promise(function(onResolve, onReject){
      onResolve(web3RpcProvider.utils.hexToNumber(result));
    });
  }
}

module.exports = helper;