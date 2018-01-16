"use strict";

const BigNumber = require("bignumber.js");

const reqPrefix           = "../../.."
    , responseHelper      = require( reqPrefix + "/lib/formatter/response" )
    , coreAddresses       = require( reqPrefix + "/config/core_addresses" )
    , web3RpcProvider = require(reqPrefix + "/lib/web3/providers/rpc_provider");

;


const utilityInteract = module.exports = function(rpcProvider){
  this._rpcInstance = web3RpcProvider.getRPCproviderInstance(rpcProvider);
}

utilityInteract.prototype = {

  /**
    * get ST balance of address from contract
    * 
    *@param {string} address - address of which ST balance is to be fetched
    *@param {Object} contractInteract - object of contract from which balance is to be fetched
    *
    *@return {Promise}
  */

  _getBalance: function (address) {

    var oThis = this;

    if (!oThis._isValidBlockChainAdress(address)) {
      return Promise.resolve(responseHelper.error('l_w_i_b_7', 'Invalid Address'));
    }

    return new Promise (function(resolve, reject){

      oThis._rpcInstance.eth.getBalance( address )
        .then( function(result){
          var stringBalance = result;
          var responseData =  responseHelper.successWithData({
            weiBalance: new BigNumber(stringBalance),
            absoluteBalance: oThis._toETHfromWei(stringBalance)
          });
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
    return this._rpcInstance.utils.isAddress(address);
  }

  ,_toETHfromWei: function(stringValue) {

    if ( typeof stringValue != 'string' ) {
      stringValue = String( stringValue );
    }

    return this._rpcInstance.utils.fromWei( stringValue, "ether" );

  }

  /**
    * returns heighest block number of chain
    *
    *@return {Promise}
  */
  ,getHigestBlockNumber: function(){
    const oThis = this;
    return new Promise (function(resolve, reject){
      oThis._rpcInstance.eth.getBlockNumber()
        .then(function(response){
          resolve (response);
        })
        .catch(function(reason){
          var responseData = responseHelper.error('l_w_i_b_1', 'Something went wrong in getHigestBlockNumber',reason);
          reject(reason);
        });
    });
  }


  /**
    * returns block of chain
    *
    *@param {Number} block_number - block number of which data is to be fetched
    *
    *@return {Promise}
  */
  ,getBlock: function(block_number){

    const oThis = this;
    return new Promise (function(resolve, reject){

      oThis._rpcInstance.eth.getBlock(block_number)
        .then(function(response){
          resolve (response);
        })
        .catch(function(reason){
          var responseData = responseHelper.error('l_w_i_b_1', 'Something went wrong in getBlock',reason);
            reject(reason);
        });
    })
  }

  /**
    * returns block of chain
    *
    *@param {Number} hash - hash of transaction which is to be fetched
    *
    *@return {Promise}
  */
  ,getTransaction: function(hash){

    const oThis = this;

    return new Promise (function(resolve, reject){

      oThis._rpcInstance.eth.getTransaction(hash)
        .then(function(response){
          resolve (response);
        })
        .catch(function(reason){
          var responseData = responseHelper.error('l_w_i_b_1', 'Something went wrong in getTransaction',reason);
            reject(reason);
        });
    })
  }

  ,getPendingTransactions: function(){

    const oThis = this;

    return new Promise (function(resolve, reject){

      oThis._rpcInstance.eth.getPendingTransaction()
        .then(function(response){
          resolve (response);
        })
        .catch(function(reason){
          var responseData = responseHelper.error('l_w_i_b_1', 'Something went wrong in getTransaction',reason);
            reject(reason);
        });
    })
  }
}

