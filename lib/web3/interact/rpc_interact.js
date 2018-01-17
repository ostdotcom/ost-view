"use strict";
/*
 * Web3 WS provider
 *
 * * Author: Kedar, Alpesh
 * * Date: 08/11/2017
 * * Reviewed by: Sunil
 */

const BigNumber = require('bignumber.js');

const web3 = require('../providers/rpc_provider')
  , responseHelper = require('../../formatter/response')
;


const _private = {

  // format the transaction receipt and decode the logs.
  formatTxReceipt: function(txReceipt) {

    return new Promise(function(onResolve, onReject){
      return onResolve(txReceipt);
    });

  },

  formatTx: function(tx) {

    return new Promise(function(onResolve, onReject){
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

  getBalance: function(address) {

    var oThis = this;

    if (!oThis._isValidBlockChainAdress(address)) {
      return Promise.resolve(responseHelper.error('l_w_i_b_7', 'Invalid Address'));
    }

    return new Promise (function(resolve, reject){

      oThis.web3RpcProvider.eth.getBalance( address )
        .then( function(result){
          var stringBalance = result;
          var responseData =  {
            weiBalance: new BigNumber(stringBalance),
            absoluteBalance: oThis._toETHfromWei(stringBalance)
          };
          return resolve(responseData);
        })
        .catch( function(reason) {
          var responseData = responseHelper.error('l_w_i_b_1', 'Something went wrong in _getBalance',reason);
          return reject(responseData);
        });
    });
  }

  /**
    * 
    *@param {string} address - hash to check in block chain
    *
    *@return {Result}
  */
  ,_isValidBlockChainAdress: function(address) {
    return this.web3RpcProvider.utils.isAddress(address);
  }

  ,_toETHfromWei: function(stringValue) {

    if ( typeof stringValue != 'string' ) {
      stringValue = String( stringValue );
    }

    return this.web3RpcProvider.utils.fromWei( stringValue, "ether" );

  }

  ,isNodeConnected : function() {
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

  ,getPendingTransactions: function(){

    const oThis = this;

    return new Promise (function(resolve, reject){

      var response = oThis.web3RpcProvider.eth.pendingTransactions;

      resolve(response);
    });
  }


  ,getRecentBlocks: function(pageNumber, pageSize){
    const oThis = this;

    return new Promise(function(resolve, reject){

      var blocksArray = [];
      var promiseResolvers = [];

      oThis.web3RpcProvider.getHigestBlockNumber()
        .then(function(heightBlockNumber){

             var lastServedBlockNumber = (page * pageSize);


              if (heightBlockNumber < lastServedBlockNumber) {
                reject("invalid page number")

                return;
              }

              var startIndex =  heightBlockNumber - lastServedBlockNumber;
              if (startIndex < 0) {
                startIndex = heightBlockNumber;
              }
              var endIndex = (startIndex-pageSize);
              if (endIndex < 0) {
                endIndex = 0;
              }

              for (var i = startIndex; i > endIndex; i--){

                promiseResolvers.push(oThis._utilityInteractInstance.getBlock(i));
             
              }
              Promise.all(promiseResolvers).then(function(rsp) {
                console.log(rsp)
                blocksArray = rsp;

                resolve(responseHelper.successWithData( blocksArray ));
              });
        });
      })
      .catch(function(reason){
        reject(reason);
      });
  } 
}

module.exports = web3Interact;