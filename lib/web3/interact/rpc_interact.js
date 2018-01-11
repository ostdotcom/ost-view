"use strict";
/*
 * Web3 WS provider
 *
 * * Author: Kedar, Alpesh
 * * Date: 08/11/2017
 * * Reviewed by: Sunil
 */

const web3 = require('../providers/rpc_provider')
  , responseHelper = require('../../formatter/response')
  , web3LogsDecoder = require('../events/decoder');

const _private = {

  // format the transaction receipt and decode the logs.
  formatTxReceipt: function(txReceipt) {

    return new Promise(function(onResolve, onReject){
      // return onResolve(web3LogsDecoder.perform(txReceipt));
      return onResolve(txReceipt);
    });

  },

  formatTx: function(tx) {

    return new Promise(function(onResolve, onReject){
      //return onResolve(web3LogsDecoder.perform(txReceipt));
       return onResolve(tx);
    });

  },

  formatBlock: function(rawBlockData) {
    return new Promise(function(onResolve, onReject){
      var r = null;

      if (rawBlockData) {
        r = responseHelper.successWithData(rawBlockData);
      } else {
        r = responseHelper.error('l_w_t_1', 'Block not found.');
      }

      onResolve(r);
    });
  },

  formatHighestBlock: function(blockNumber) {
    return new Promise(function(onResolve, onReject) {

      var r = null;

      if (!blockNumber || blockNumber == 0) {
        r = responseHelper.error('l_w_t_2', 'Highest Block not found.');
      } else {
        r = responseHelper.successWithData({'block_number': blockNumber});
      }

      onResolve(r);
    });
  },

  formatBalance: function(balance) {
    return new Promise(function(onResolve, onReject) {

      var r = null;

      if (!balance) {
        r = responseHelper.error('l_w_t_3', 'Balance not found.');
      } else {
        r = responseHelper.successWithData({'balance': balance});
      }

      onResolve(r);
    });
  }

};

const web3Interact = module.exports = function(webrpc){
  this.web3RpcProvider = web3.getRPCproviderInstance(webrpc);
}

web3Interact.prototype = {

  // get transaction receipt
  getReceipt: function(transactionHash) {
    return this.web3RpcProvider.eth.getTransactionReceipt(transactionHash)
      .then(_private.formatTxReceipt);
  },

  getTransaction: function(transactionHash) {
    return this.web3RpcProvider.eth.getTransaction(transactionHash)
      .then(_private.formatTx);
  },

  // get block using a block number
  getBlock: function(blockNumber) {
    return this.web3RpcProvider.eth.getBlock(blockNumber)
      .then(_private.formatBlock);
  },

  // get highest block number
  highestBlock: function() {
    return this.web3RpcProvider.eth.getBlockNumber()
      .then(_private.formatHighestBlock);
  },

  getBalance: function(addr) {
    return this.web3RpcProvider.eth.getBalance(addr)
      .then(_private.formatBalance);
  },

  isNodeConnected : function() {
    var oThis = this;
    return new Promise(function(resolve, reject) {
        oThis.web3RpcProvider.eth.net.isListening()
        .then(function(){
               resolve();
            }).catch(function(msg){
               console.log('Node is not connected', msg);
               reject('Node is not connected');
            });
      });       
    } 
}

module.exports = web3Interact;