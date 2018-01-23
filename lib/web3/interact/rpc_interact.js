"use strict";
/**
 * Web3 RPC provider
 *
 * @module lib/web3/interact/rpc_interact
 */
// Load external libraries
const BigNumber = require('bignumber.js');

// Load internal files
const rootPrefix = '../../..'
  , web3 = require(rootPrefix + '/lib/web3/providers/rpc_provider')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

// Private method implementation
const _private = {

  // format the transaction receipt and decode the logs.
  formatTxReceipt: function (txReceipt) {
    return new Promise(function (onResolve, onReject) {
      return onResolve(txReceipt);
    });
  },

  // format transaction
  formatTx: function (tx) {
    return new Promise(function (onResolve, onReject) {
      return onResolve(tx);
    });
  },

  // format Block
  formatBlock: function (rawBlockData) {
    return new Promise(function (onResolve, onReject) {
      var r = null;

      if (rawBlockData) {
        r = responseHelper.successWithData(rawBlockData);
      } else {
        r = responseHelper.error('l_w_t_1', 'Block not found.');
      }

      onResolve(r);
    });
  },

  // format highest block
  formatHighestBlock: function (blockNumber) {
    return new Promise(function (onResolve, onReject) {

      var r = null;

      if (!blockNumber || blockNumber == 0) {
        r = responseHelper.error('l_w_t_2', 'Highest Block not found.');
      } else {
        r = responseHelper.successWithData({'block_number': blockNumber});
      }

      onResolve(r);
    });
  },

  // format balance
  formatBalance: function (balance) {
    return new Promise(function (onResolve, onReject) {

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

/**
 * Web3 Interact constructor
 *
 * @param  {String} webrpc - RPC provider
 *
 * @constructor
 */
const web3Interact = function (webrpc) {
  this.web3RpcProvider = web3.getRPCproviderInstance(webrpc);
}

web3Interact.prototype = {

  /**
   * Get transaction receipt of a given transaction hash
   *
   * @param  {String} transactionHash - Transaction Hash
   * @return {Promise}
   */
  getReceipt: function (transactionHash) {
    return this.web3RpcProvider.eth.getTransactionReceipt(transactionHash)
      .then(_private.formatTxReceipt);
  },

  /**
   * Get transaction details for a given transaction hash
   *
   * @param  {String} transactionHash - Transaction Hash
   * @return {Promise}
   */
  getTransaction: function (transactionHash) {
    return this.web3RpcProvider.eth.getTransaction(transactionHash)
      .then(_private.formatTx);
  },

  /**
   * Get block details using a block number
   *
   * @param  {Integer} blockNumber - Block Number
   * @return {Promise}
   */
  getBlock: function (blockNumber) {
    return this.web3RpcProvider.eth.getBlock(blockNumber)
      .then(_private.formatBlock);
  },

  /**
   * To get highest block number in Block chain
   *
   * @return {Promise}
   */
  highestBlock: function () {
    return this.web3RpcProvider.eth.getBlockNumber()
      .then(_private.formatHighestBlock);
  },

  /**
   * To get Balance of a given address
   *
   * @param  {String} address - Address
   * @return {Promise}
   */
  getBalance: function (address) {

    var oThis = this;

    if (!oThis.isValidBlockChainAddress(address)) {
      return Promise.resolve(responseHelper.error('l_w_i_r_7', 'Invalid Address'));
    }

    return new Promise(function (resolve, reject) {

      oThis.web3RpcProvider.eth.getBalance(address)
        .then(function (result) {
          var stringBalance = result;
          var responseData = {
            weiBalance: new BigNumber(stringBalance),
            absoluteBalance: oThis.toETHfromWei(stringBalance)
          };
          return resolve(responseData);
        })
        .catch(function (reason) {
          var responseData = responseHelper.error('l_w_i_r_1', 'Something went wrong in _getBalance', reason);
          return reject(responseData);
        });
    });
  }

  /**
   * Check if address is valid or not
   *
   * @param {string} address - address
   *
   * @return {Boolean}
   */
  , isValidBlockChainAddress: function (address) {
    return this.web3RpcProvider.utils.isAddress(address);
  }

  /**
   * Convert Wei to ETH
   *
   * @param {Integer} balance - Balance in Wei
   *
   * @return {Decimal}
   */
  , toETHfromWei: function (balance) {
    if (typeof balance != 'string') {
      balance = String(balance);
    }
    return this.web3RpcProvider.utils.fromWei(balance, "ether");
  }

  /**
   * To check whether rpc connection is live or not from the node.
   *
   * @return {Promise}
   */
  , isNodeConnected: function () {
    var oThis = this;
    return new Promise(function (resolve, reject) {
      oThis.web3RpcProvider.eth.net.isListening()
        .then(function () {
          resolve();
        }).catch(function (msg) {
        console.log('Node is not connected', msg);
        reject('Node is not connected');
      });
    });
  }

  /**
   * Get pending transactions from chain
   *
   * @return {Promise}
   */
  , getPendingTransactions: function () {

    const oThis = this;

    return new Promise(function (resolve, reject) {

      var response = oThis.web3RpcProvider.eth.pendingTransactions;

      resolve(response);
    });
  }

  ,isContract: function(address){

    const oThis = this;

    return new Promise (function(resolve, reject){

       oThis.web3RpcProvider.eth.getCode(address)
        .then(function(response){
            if(response === "0x"){
                reject(false);
            }else{
              resolve(true);
            }
        })
        .catch(function(reason){
            reject(reason);
        });

    });
  } 
}

module.exports = web3Interact;