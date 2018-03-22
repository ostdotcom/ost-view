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
  , coreConfig = require(rootPrefix + '/config')
  , coreAbi = require(rootPrefix + '/config/core_abis')
  , logger = require(rootPrefix + "/helpers/custom_console_logger")

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
  },

  handleCatch: function (error) {
    return new Promise(function (onResolve, onReject) {

      var r = responseHelper.error('rpc_interact geth error :: ', error);
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
};

web3Interact.prototype = {

  /**
   * Get transaction receipt of a given transaction hash
   *
   * @param  {String} transactionHash - Transaction Hash
   * @return {Promise}
   */
  getReceipt: function (transactionHash) {
    const oThis = this
    ;

    return this.web3RpcProvider.eth.getTransactionReceipt(transactionHash)
      .then(_private.formatTxReceipt)
      .catch( function ( reason ) {
        logger.error('getReceipt :: Failed to get receipt for ', transactionHash ,"\n\tReason:", reason);
        logger.error("getReceipt catch debug isNodeConnected-");
        oThis.web3Interact.isNodeConnected().then(console.log);
        return Promise.reject( reason );
      });
  },

  /**
   * Get transaction details for a given transaction hash
   *
   * @param  {String} transactionHash - Transaction Hash
   * @return {Promise}
   */
  getTransaction: function (transactionHash) {
    return this.web3RpcProvider.eth.getTransaction(transactionHash)
      .then(_private.formatTx)
      .catch(_private.handleCatch);
  },

  /**
   * Get block details using a block number
   *
   * @param  {Integer} blockNumber - Block Number
   * @return {Promise}
   */
  getBlock: function (blockNumber, getTransactions) {
    getTransactions = getTransactions || false;
    return this.web3RpcProvider.eth.getBlock(blockNumber, getTransactions)
      .then(_private.formatBlock)
      .catch(_private.handleCatch);
  },

  /**
   * To get highest block number in Block chain
   *
   * @return {Promise}
   */
  highestBlock: function () {
    return this.web3RpcProvider.eth.getBlockNumber()
      .then(_private.formatHighestBlock)
      .catch(_private.handleCatch);
  },

  /**
   * To get Balance of a given address
   *
   * @param  {String} address - Address
   * @param  {String} contractAddress - Contract Address
   * @return {Promise}
   */
  getBalance: function (address, contractAddress) {

    var oThis = this;

    if (!oThis.isValidBlockChainAddress(address)) {
      return Promise.resolve(responseHelper.error('l_w_i_r_7', 'Invalid Address'));
    }

    return new Promise(function (resolve, reject) {
      if (contractAddress != undefined && contractAddress.length > 1) {
        var token = new oThis.web3RpcProvider.eth.Contract(coreAbi.getInstance().getERC20TokenABI(), contractAddress);
        token.methods.balanceOf(address).call()
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

      } else {

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
      }
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

    return new Promise (function(resolve, reject) {
      oThis.web3RpcProvider.eth.net.isListening()
        .then(function () {
          oThis.web3RpcProvider.eth.getCode(address)
            .then(function (response) {

              if (response === "0x") {
                reject(false);
              } else {
                resolve(true);
              }
            })
            .catch(function (reason) {
              reject(reason);
            });
        })
        .catch(function () {
          reject(false);
        });
    });
  },

  /**
   *
   * Get Total supply of tokens in the ERC20 Token
   * @param {String} contractAddress - Contract address
   * @returns {*|wrappedPromise}
   *
   */
  getTotalSupply: function(contractAddress) {
    var oThis = this;
    return new Promise(function (resolve, reject) {
      if (contractAddress != undefined && contractAddress.length > 1) {
        var token = new oThis.web3RpcProvider.eth.Contract(coreAbi.getInstance().getERC20TokenABI(), contractAddress);
        token.methods.totalSupply().call()
            .then(function (result) {
              return resolve(result);
            })
            .catch(function (reason) {
              var responseData = responseHelper.error('Something went wrong in _totalSupply balance', reason);
              return reject(responseData);
            });

      } else {
          resolve(0);
      }
    });
  }
};


// To create Singleton instance of DbHelper of repective chainIDs.
const web3InteractHelper = (function () {
  const instances = {};

  function createInstance(webRpcURL) {
    return new web3Interact(webRpcURL);
  }

  return {
    getInstance: function (chainId) {
      const existingInstance = instances[chainId];

      if(existingInstance) return existingInstance;

      const newInstance = createInstance(coreConfig.getWebRpcUrl(chainId));

      instances[chainId] = newInstance;

      return newInstance;
    }
  };
})();



module.exports = web3InteractHelper;