"use strict";
/**
 * Interface File to interact with multiple DB flavours. Current DB implementations are:
 *
 *  <ul>
 *    <li>MySQL implementation - ref: {@link module:lib/storage/mysql}</li>
 *  </ul>
 *
 * @module lib/storage/interact
 */

// Load internal files
const rootPrefix = "../.."
  , MySQL = require(rootPrefix + '/lib/storage/mysql')
  , constants = require(rootPrefix + '/config/core_constants')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const DEFAULT_PAGE_NUMBER = constants.DEFAULT_PAGE_NUMBER;
const DEFAULT_PAGE_SIZE = constants.DEFAULT_PAGE_SIZE;

/**
 * Constructor to create DbHelper object
 *
 * @param {Object} dbObj - DB Object
 *
 * @constructor
 */
const DbHelper = function (dbObj) {
  this.dbObject = dbObj;
}

DbHelper.prototype = {

  /**
   * To Delegate getContractTransactions call to the DB
   *
   * @param {String} contractAddress - contract address
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page sise
   *
   * @return {Promise}
   */
  getContractTransactions: function (contractAddress,pageNumber, pageSize){
     if (undefined == pageNumber) {
        pageNumber = DEFAULT_PAGE_NUMBER;
     }
     if (undefined == pageSize) {
        pageSize = DEFAULT_PAGE_SIZE;
     }

    return this.dbObject.getContractTransactions(contractAddress, pageNumber, pageSize);
  },


  /**
   * To Delegate getTransaction call to the DB
   *
   * @param {String} transactionHash - Transaction hash
   *
   * @return {Promise}
   */
  getTransaction: function (transactionHash) {
    return this.dbObject.selectTransaction(transactionHash);
  },

  /**
   * To Delegate get coin details from DB
   *
   * @param {String} contractAddress - contract address
   *
   * @return {Promise}
   */
  getCoinFromContractAddress: function (contractAddress) {
    return this.dbObject.selectCoinFromContractAddress(contractAddress);
  },

  /**
   * To Delegate get coin details from DB
   *
   * @param {String} contractAddress - contract address
   *
   * @return {Promise}
   */
  getBrandedTokenFromId: function (brandedTokenId) {
    return this.dbObject.selectBrandedTokenFromId(brandedTokenId);
  },


  /**
   * To Delegate getRecentBlocks call to the DB
   *
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page sise
   *
   * @return {Promise}
   */
  getRecentBlocks: function (pageNumber, pageSize) {
    if (undefined == pageNumber) {
      pageNumber = DEFAULT_PAGE_NUMBER;
    }
    if (undefined == pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
    }

    return this.dbObject.selectRecentBlocks(pageNumber, pageSize);
  },

  /**
   * To Delegate getBlockFromBlockNumber call to the DB
   *
   * @param {Integer} blockNumber - Number of the block
   *
   * @return {Promise}
   */
  getBlockFromBlockNumber: function (blockNumber) {
    return this.dbObject.selectBlockFromBlockNumber(blockNumber);
  },

  /**
   * To Delegate getBlockFromBlockHash call to the DB
   *
   * @param {Integer} blockNumber - Number of the block
   *
   * @return {Promise}
   */
  getBlockFromBlockHash: function (blockHash) {
  return this.dbObject.selectBlockFromBlockHash(blockHash);
  },

  /**
   * To Delegate getBlockNumberFromBlockHash call to the DB
   *
   * @param {Integer} blockHash - hash of the block
   *
   * @return {Promise}
   */
  getBlockNumberFromBlockHash: function (blockHash) {

    const oThis = this;
    return new Promise(function(resolve, reject){
      oThis.dbObject.selectBlockFromBlockHash(blockHash)
        .then(function(response){
          resolve(response[0].number);
        })
        .catch(function(reason){
          reject(reason);
        });
    });
  },


  /**
   * To Delegate get address LedgerOfContract call to the DB
   *
   * @param {String} address - Address
   * @param {String} contractAddress - Contract Address
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page size
   *
   * @return {Promise}
   */
  getAddressLedgerOfContract: function (address, contractAddress, pageNumber, pageSize) {
    if (undefined == pageNumber) {
      pageNumber = DEFAULT_PAGE_NUMBER;
    }
    if (undefined == pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
    }

    return this.dbObject.selectAddressLedgerOfContract(address, contractAddress, pageNumber, pageSize);
  },

  /**
   * To Delegate getContractLedger call to the DB
   *
   * @param {String} contractAddress - Contract Address
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page size
   *
   * @return {Promise}
   */
  getContractLedger: function (contractAddress, pageNumber, pageSize) {
    if (undefined == pageNumber) {
      pageNumber = DEFAULT_PAGE_NUMBER;
    }
    if (undefined == pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
    }

    return this.dbObject.selectContractLedger(contractAddress, pageNumber, pageSize);
  },

  /**
   * To Delegate getHigestInsertedBlock call to the DB
   * 
   * @return {Promise}
   */
  getHigestInsertedBlock: function () {
    return this.dbObject.selectHigestInsertedBlock();
  },

  /**
   * To Delegate getLowestUnVerifiedBlockNumber call to the DB 
   * 
   * @return {Promise}
   */
  getLowestUnVerifiedBlockNumber: function () {
    return this.dbObject.selectLowestUnVerifiedBlockNumber();
  },

  /**
   * To Delegate getRecentTransactions call to the DB
   *
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page size
   *
   * @return {Promise}
   */
  getRecentTransactions: function (pageNumber, pageSize) {
    if (undefined == pageNumber) {
      pageNumber = DEFAULT_PAGE_NUMBER;
    }
    if (undefined == pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
    }

    return this.dbObject.selectRecentTransactions(pageNumber, pageSize);
  },

  /**
   * To Delegate get block transactions call to the DB
   *
   * @param {Integer} blockHash - block hash
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page size
   *
   * @return {Promise}
   */
  getBlockTransactionsFromBlockHash: function (blockHash, pageNumber, pageSize) {
    if (undefined == pageNumber) {
      pageNumber = DEFAULT_PAGE_NUMBER;
    }
    if (undefined == pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
    }

    const oThis = this;
    return new Promise(function(resolve, reject){
      oThis.getBlockNumberFromBlockHash(blockHash)
        .then(function(response){
          oThis.dbObject.getBlockTransactionsFromBlockNumber(response, pageNumber, pageSize)
            .then(function(response){
                resolve(response)
            })
            .catch(function (reason) {
              reject(reason);
            })
        })
        .catch(function(reason){
          reject(reason);
        });
    });
  },

  /**
   * To Delegate get block transactions call to the DB
   *
   * @param {Integer} blockNumber - block number
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page size
   *
   * @return {Promise}
   */
  getBlockTransactionsFromBlockNumber: function (blockNumber, pageNumber, pageSize) {
    if (undefined == pageNumber) {
      pageNumber = DEFAULT_PAGE_NUMBER;
    }
    if (undefined == pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
    }
    return this.dbObject.getBlockTransactionsFromBlockNumber(blockNumber, pageNumber, pageSize);
  },


  /**
   * To Delegate to get address transactions call to the DB
   *
   * @param {String} address - Address
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page size
   *
   * @return {Promise}
   */
  getAddressTransactions: function (address, pageNumber, pageSize) {
    if (undefined == pageNumber) {
      pageNumber = DEFAULT_PAGE_NUMBER;
    }
    if (undefined == pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
    }

    return this.dbObject.selectAddressTransactions(constants.ADDRESS_TRANSACTION_TABLE_NAME, address, pageNumber, pageSize);
  },

  /**
   * To Delegate get address token transactions call to the DB
   *
   * @param {String} address - Address
   * @param {Integer} pageNumber - page number
   * @param s{Integer} pageSize - page size
   *
   * @return {Promise}
   */
  getAddressTokenTransactions: function (address, pageNumber, pageSize) {
    if (undefined == pageNumber) {
      pageNumber = DEFAULT_PAGE_NUMBER;
    }
    if (undefined == pageSize) {
      pageSize = DEFAULT_PAGE_SIZE;
    }

    return this.dbObject.selectAddressTransactions(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, address, pageNumber, pageSize);
  },


  getAddressDetailsFromDB: function (address){
    return this.dbObject.selectAddressDetails(address);
  },

  /**
   * To Delegate insert block call to the DB
   *
   * @param {Array} blockDataArray - Array of Block Data Content Array
   *
   * @return {Promise}
   */
  insertBlock: function (blockDataArray) {
    return this.dbObject.insertData(constants.BLOCK_TABLE_NAME, constants.BLOCKS_DATA_SEQUENCE, blockDataArray);
  },

  /**
   * To Delegate insert transactions to DB. It also handles insert address transaction to DB
   *
   * @param {Array} transactionDataArray - Array of Transactions Data Content Array
   * @return {Promise}
   */
  insertTransaction: function (transactionDataArray) {
    var oThis = this;
    return new Promise(function (resolve, reject) {
      var result = [];
      var transactionPromiseList = [];
      var addressTransactionData = [];
      for (var ind in transactionDataArray) {
        var transactionData = transactionDataArray[ind];
        var transactionResponse = oThis.dbObject.insertData(constants.TRANSACTION_TABLE_NAME, constants.TRANSACTION_DATA_SEQUENCE, transactionData);
        transactionPromiseList.push(transactionResponse);

        //Format transactions
        var txnArray = oThis.formatAddressTransactionData(transactionData);
        txnArray.forEach(function (addrTxn) {
          addressTransactionData.push(addrTxn);
        });
      }

      logger.log(addressTransactionData);

      Promise.all(transactionPromiseList)
        .then(function (res) {
          result.push(res);

          oThis.insertAddressTransaction(addressTransactionData)
            .then(function (res) {
              result.push(res);
              resolve(result);
            });
        });
    });
  },

  /**
   * To Delegate insert address transaction to the DB
   *
   * @param {Array} addressTransactionData - Array of Address Transaction Data
   *
   * @return {Promise}
   */
  insertAddressTransaction: function (addressTransactionData) {
    return this.dbObject.insertData(constants.ADDRESS_TRANSACTION_TABLE_NAME, constants.ADDRESS_TRANSACTION_DATA_SEQUENCE, addressTransactionData);
  },

  /**
   * To Delegate insert token transaction to the DB. It also handles insert address token transaction call to the DB
   *
   * @param {Array} tokenTransactionDataArray - Array of TokenTransactions Data Content Array
   *
   * @return {Promise}
   */
  insertTokenTransaction: function (tokenTransactionDataArray) {
    var oThis = this;
    return new Promise(function (resolve, reject) {
      var result = [];
      var transactionPromiseList = [];
      var addressTransactionData = [];
      for (var ind in tokenTransactionDataArray) {
        var tokenTransactionData = tokenTransactionDataArray[ind];
        var transactionResponse = oThis.dbObject.insertData(constants.TOKEN_TRANSACTION_TABLE_NAME, constants.TOKEN_TRANSACTION_DATA_SEQUENCE, tokenTransactionData);
        transactionPromiseList.push(transactionResponse);

        //Format token transactions
        var txnArray = oThis.formatAddressTokenTransactionData(tokenTransactionData);
        txnArray.forEach(function (addrTxn) {
          addressTransactionData.push(addrTxn);
        });
      }

      logger.log(addressTransactionData);

      Promise.all(transactionPromiseList)
        .then(function (res) {
          result.push(res);

          oThis.insertAddressTokenTransaction(addressTransactionData)
            .then(function (res) {
              result.push(res);
              resolve(result);
            });
        });
    });
  },

  /**
   * To Delegate insert address token transaction call to the DB
   *
   * @param {Array} addressTokenTransactionData - Array of Token Address Transaction Data
   *
   * @return {Promise}
   */
  insertAddressTokenTransaction: function (addressTokenTransactionData) {
    return this.dbObject.insertData(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, constants.ADDRESS_TOKEN_TRANSACTION_DATA_SEQUENCE, addressTokenTransactionData);
  },

  /**
   * Get address transaction details
   *
   * @param {Object} transactionData - Transactions data
   *
   * @return {Array}
   */
  formatAddressTransactionData: function (transactionData) {
    var addressTxnArray = [];

    var txnMap = constants['TRANSACTION_INDEX_MAP'];

    var addressTxnFirst = [];
    var addressTxnSecond = [];

    addressTxnFirst.push(transactionData[txnMap['t_from']]);
    addressTxnSecond.push(transactionData[txnMap['t_to']]);

    addressTxnFirst.push(transactionData[txnMap['t_to']]);
    addressTxnSecond.push(transactionData[txnMap['t_from']]);

    addressTxnFirst.push(transactionData[txnMap['tokens']]);
    addressTxnSecond.push(transactionData[txnMap['tokens']]);

    addressTxnFirst.push(transactionData[txnMap['hash']]);
    addressTxnSecond.push(transactionData[txnMap['hash']]);

    var fees = transactionData[txnMap['gas_price']] * transactionData[txnMap['gas_used']];
    addressTxnFirst.push(fees);
    addressTxnSecond.push(fees);

    addressTxnFirst.push(0);
    addressTxnSecond.push(1);

    addressTxnFirst.push(transactionData[txnMap['timestamp']]);
    addressTxnSecond.push(transactionData[txnMap['timestamp']]);

    //Push address transactions
    addressTxnArray.push(addressTxnFirst);
    if (transactionData[txnMap['t_to']] && transactionData[txnMap['t_to']] != transactionData[txnMap['t_from']]) {
      addressTxnArray.push(addressTxnSecond);
    }

    return addressTxnArray;
  },

  /**
   * Get address token transaction details
   *
   * @param {Object} transactionData - Transactions data
   *
   * @return {Array}
   */
  formatAddressTokenTransactionData: function (transactionData) {
    var addressTxnArray = [];

    var txnMap = constants['TOKEN_TRANSACTION_INDEX_MAP'];

    var addressTxnFirst = [];
    var addressTxnSecond = [];

    addressTxnFirst.push(transactionData[txnMap['t_from']]);
    addressTxnSecond.push(transactionData[txnMap['t_to']]);

    addressTxnFirst.push(transactionData[txnMap['t_to']]);
    addressTxnSecond.push(transactionData[txnMap['t_from']]);

    addressTxnFirst.push(transactionData[txnMap['tokens']]);
    addressTxnSecond.push(transactionData[txnMap['tokens']]);

    addressTxnFirst.push(transactionData[txnMap['contract_address']]);
    addressTxnSecond.push(transactionData[txnMap['contract_address']]);

    addressTxnFirst.push(transactionData[txnMap['hash']]);
    addressTxnSecond.push(transactionData[txnMap['hash']]);

    addressTxnFirst.push(0);
    addressTxnSecond.push(1);

    addressTxnFirst.push(transactionData[txnMap['timestamp']]);
    addressTxnSecond.push(transactionData[txnMap['timestamp']]);

    //Push address transactions
    addressTxnArray.push(addressTxnFirst);
    addressTxnArray.push(addressTxnSecond);

    return addressTxnArray;
  },

  /**
   * To Delegate call deleting all the data of a given block number.
   *
   * @param {Integer} blockNumber - Block number
   *
   * @return {Promise}
   */
  deleteBlock: function (blockNumber) {
    if (blockNumber) {
      return this.dbObject.deleteForBlockNumber(blockNumber);
    }
    return Promise.reject(new Error('blockNumber is undefined'));

  },

  /**
   * To Delegate delete address token transactions from DB.
   *
   * @param {Array} txnHashArray - Transaction hash array to be deleted
   *
   * @return {Promise}
   */
  deleteAddressTokenTransactions: function (txnHashArray) {
    if (txnHashArray) {
      return this.dbObject.deleteForTransactions(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, 'transaction_hash', txnHashArray);
    }
    return Promise.reject(new Error('txnHashArray is undefined'));
  },

  /**
   * To Delegate delete token transactions from DB.
   *
   * @param {Array} txnHashArray - Transaction hash array to be deleted
   *
   * @return {Promise}
   */
  deleteTokenTransactions: function (txnHashArray) {
    if (txnHashArray) {
      return this.dbObject.deleteForTransactions(constants.ADDRESS_TRANSACTION_TABLE_NAME, 'transaction_hash', txnHashArray);
    }
    return Promise.reject(new Error('txnHashArray is undefined'));
  },

  /**
   * To Delegate delete address transactions call to DB.
   *
   * @param {Array} txnHashArray - Transaction hash array to be deleted
   *
   * @return {Promise}
   */
  deleteAddressTransactions: function (txnHashArray) {
    if (txnHashArray) {
      return this.dbObject.deleteForTransactions(constants.TOKEN_TRANSACTION_TABLE_NAME, 'hash', txnHashArray);
    }
    return Promise.reject(new Error('txnHashArray is undefined'));
  },

  /**
   * To Delegate delete transactions from DB.
   *
   * @param {Array} txnHashArray - Transaction hash array to be deleted
   * @return {Promise}
   */
  deleteTransactions: function (txnHashArray) {
    if (txnHashArray) {
      return this.dbObject.deleteForTransactions(constants.TRANSACTION_TABLE_NAME, 'hash', txnHashArray);
    }
    return Promise.reject(new Error('txnHashArray is undefined'));
  },

  /**
   * To Delegate call to update verify flag of the block data in DB.
   * @param  {Integer} blockNumber Number of the block
   * @return {Promise}
   */
  updateVerifiedFlag: function (blockNumber) {
    if (undefined != blockNumber) {
      return this.dbObject.updateAttribute(constants.BLOCK_TABLE_NAME, 'verified', true, 'number', blockNumber);
    }
    return Promise.reject(new Error('blockNumber is undefined'));
  },

  getChainHomeData: function() {
    return this.dbObject.selectChainData();
  },

  getBrandedTokenIdFromContract: function(contract){
    return this.dbObject.selectBrandedTokenIdFromContract(contract);
  },

  getAddressesWithBrandedToken: function(brandedTokenId, pageNumber, PageSize){
    return this.dbObject.selectAddressesWithBrandedToken(brandedTokenId, pageNumber, PageSize);
  }

  /**
   * Get transaction values in given contract address
   * @param {Integer} contractAddress - contract address
   */
  ,getGraphDataForBrandedTokenTransactions:function(contractAddress){
    return this.dbObject.selectGraphDataForBrandedTokenTransactions(contractAddress);
  }


  , getRecentTokenTransactions: function(pageNumebr, pageSize, pagePaylaod){
    return this.dbObject.selectRecentTokenTransactions(pageNumebr, pageSize, pagePaylaod);

  }

  ,getTopTokens : function(pageNumebr, pageSize, pagePayload){
    return this.dbObject.selectTopTokens(pageNumebr, pageSize, pagePayload);
  }

};


// To create Singleton instance of DbHelper of repective chainIDs.
const dbHelperHandler = (function () {

  const dbHelpers = {};

  function createInstance(dbconfig) {
    var dbObject;
    if (dbconfig.driver == "mysql") {
      dbObject = new MySQL(dbconfig);
    } else {
      throw "No supported storage driver found in interact.js";
    }
    var object = new DbHelper(dbObject);
    return object;
  }

  return {
    getInstance: function (dbconfig) {
      const id = dbconfig.chainId;
      if (!dbHelpers[id]) {

        const instance = createInstance(dbconfig);
        dbHelpers[id] = instance
      }
      return dbHelpers[id];
    }
  };

})();

module.exports = dbHelperHandler;