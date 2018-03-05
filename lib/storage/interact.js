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
};

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
  getContractTransactions: function (contractAddress, pageNumber, pageSize){
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
    return this.dbObject.selectTransaction(constants.TRANSACTION_TABLE_NAME ,transactionHash);
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
   * @param {Integer} blockHash - Hash of the block
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
   * To Delegate getHighestInsertedBlock call to the DB
   * 
   * @return {Promise}
   */
  getHighestInsertedBlock: function () {
    return this.dbObject.selectHighestInsertedBlock();
  },

  /**
   * To Delegate getLowestUnVerifiedBlockNumber call to the DB 
   * 
   * @return {Promise}
   */
  getLowestUnVerifiedBlockNumber: function () {
    return this.dbObject.selectLowestUnVerifiedBlockNumber();
  },

  getBlockNumberForTimestamp: function (timestamp) {
    return this.dbObject.selectBlockNumberForTimeStamp(timestamp);
  },

  getAggregateLastInsertedTimeId: function () {
    return this.dbObject.selectAggregateLastInsertedTimeStamp();
  },

  /**
   * Get Last Verified Block Timestamp
   *
   * @return {Promise}
   */
  getLastVerifiedBlockTimestamp: function () {
    var oThis = this;
    return new Promise(function(resolve, reject){
        oThis.dbObject.selectLowestUnVerifiedBlockNumber()
            .then(function( blockNumber ){
                oThis.dbObject.selectBlockFromBlockNumber(blockNumber)
                    .then(function( block ){
                        if (undefined === block) {
                          logger.error("interact#getLastVerifiedBlockTimestamp block is undefined having block number", blockNumber);
                          reject("interact#getLastVerifiedBlockTimestamp block is undefined having block number " + blockNumber);
                        } else {
                          resolve(block.timestamp);
                        }
                    }, reject);
            }, reject);
    });


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
   * @param {Integer} pageSize - page size
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
   * To Delegate get token transactions call to the DB
   *
   * @param {String} address - Address
   * @param {Integer} pageNumber - page number
   * @param {Integer} pageSize - page size
   *
   * @return {Promise}
   */
  getTokenTransactions: function (transactionHash) {

    return this.dbObject.selectTransaction(constants.TOKEN_TRANSACTION_TABLE_NAME, transactionHash);
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

    addressTxnFirst.push(transactionData[txnMap['transaction_hash']]);
    addressTxnSecond.push(transactionData[txnMap['transaction_hash']]);

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

    addressTxnFirst.push(transactionData[txnMap['transaction_hash']]);
    addressTxnSecond.push(transactionData[txnMap['transaction_hash']]);

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
      return this.dbObject.deleteForTransactions(constants.TOKEN_TRANSACTION_TABLE_NAME, 'transaction_hash', txnHashArray);
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
      return this.dbObject.deleteForTransactions(constants.TRANSACTION_TABLE_NAME, 'transaction_hash', txnHashArray);
    }
    return Promise.reject(new Error('txnHashArray is undefined'));
  },

  /**
   * To Delegate call to update verify flag of the block data in DB.
   * @param  {Integer} blockNumber - Number of the block
   * @return {Promise}
   */
  updateVerifiedFlag: function (blockNumber) {
    if (undefined != blockNumber) {
      return this.dbObject.updateAttribute(constants.BLOCK_TABLE_NAME, 'verified', true, 'block_number', blockNumber);
    }
    return Promise.reject(new Error('blockNumber is undefined'));
  },

  /**
   * Get Transactions within timeIds
   * @param timeId - Time id
   * @returns {Promise}
   */
  getTransactionsByTimeId: function (timeId) {
    return this.dbObject.selectTransactionsBetweenTimestamp(timeId, timeId + constants.AGGREGATE_CONSTANT);
  },

  /**
   * Get Transaction type from the transaction hash
   * @param transactionsHashes - Transaction hashes
   * @returns {Promise}
   */
  getTransactionType: function (transactionsHashes) {
    if (transactionsHashes.length > 0) {
      return this.dbObject.selectTransactionsType(transactionsHashes);
    }
    return Promise.resolve([]);
  },

  /**
   * Insert Data into Aggregate Table
   * @param {Array} aggregateDataArray - Aggregate data array
   * @returns {*|Promise}
   */
  insertIntoAggregateTable: function(aggregateDataArray) {
    return this.dbObject.insertData(constants.AGGREGATE_TABLE_NAME, constants.AGGREGATE_DATA_SEQUENCE, aggregateDataArray);
  },

  /**
   * Insert Or Update Address Table
   * @param {Array} formattedDataArray - Formatted data array
   * @returns {*|Promise}
   */
  insertOrUpdateAddressData: function(formattedDataArray) {
    return this.dbObject.insertOrUpdateAddressData(formattedDataArray);
  },

  /**
   * Get Aggregate data within time stamp
   * @param {Integer} contractId - Contract Id of the company
   * @param {Integer} timeId1 - left bound of timestamp
   * @param {Integer} timeId2 - right bound of timestamp
   */
  getAggregateDataWithinTimestamp: function(contractId, timeId1, timeId2) {
    return this.dbObject.selectAggregateDataWithinTimestamp(contractId, timeId1, timeId2, false);
  },

  /**
   * Get Aggregate data within time stamp by type
   * @param {Integer} contractId - Contract Id of the company
   * @param {Integer} timeId1 - left bound of timestamp
   * @param {Integer} timeId2 - right bound of timestamp
   */
  getAggregateDataWithinTimestampByType: function(contractId, timeId1, timeId2) {
    return this.dbObject.selectAggregateDataWithinTimestamp(contractId, timeId1, timeId2, true);
  },

  /**
   * To insert or update Company data
   * @param {Array} formattedDataArray - Formatted data array of company data
   */
  insertOrUpdateCompanyDataArray: function(formattedDataArray) {
    return this.dbObject.insertOrUpdateCompanyData(formattedDataArray);
  },

  /**
   * Get Total Number of token holders of given company token id
   * @param {Integer} contractTokenId - Contract Token Id
   */
  getTotalTokenDetails: function(contractTokenId) {
    return this.dbObject.selectTotalTokenDetails(contractTokenId);
  },

  /**
   * Get Branded token Details.
   * @returns {Promise}
   */
  getBrandedTokenDetails: function() {
    return this.dbObject.selectBrandedTokenDetails()
        .then(function(result){
          if (undefined == result) {
            console.log("Branded Token Details returned undefined");
            result = [];
          }
          return Promise.resolve(result);
        });
  },

  /**
   * Get No of rows in Branded Token details
   */
  numberOfRowsInBrandedTokenTable: function() {
    return this.dbObject.selectBrandedTokenDetails()
      .then(function (result) {
        return Promise.resolve(result.length);
      });
  },

  /**
   * Get transaction values in given contract address
   * @param {Integer} brandedTokenId - branded Token Id
   */
  getDataForBrandedTokenTransactionsByType:function(brandedTokenId){
    return this.dbObject.selectDataForBrandedTokenTransactionsByType(brandedTokenId);
  },

  /**
   * Get Values and volume of transactions in given contract address
   * @param {Integer} contractAddress - contract address
   */
  getValuesAndVolumesOfBrandedTokenTransactions: function(contractAddress){
    return this.dbObject.selectValuesAndVolumesOfBrandedTokenTransactions(contractAddress);
  },

  /**
   * Get top users in given contract address
   * @param {Integer} contractId - contract id
   * @param {Integer} topUsersCount - top User Count
   */
  getBrandedTokenTopUsers: function(contractId, topUsersCount){
    return this.dbObject.selectBrandedTokenTopUsers(contractId, topUsersCount);
  },

  /**
   * Get ost supply of given contract address
   * @param {Integer} contractId - contract id
   */
  getOstSupply: function(contractId){
    return this.dbObject.getOstSupply(contractId);
  },

  /**
   * To initialize Branded token table
   */
  initBrandedTokenTable: function() {

    var dataRow = [];
    dataRow.push(0);
    dataRow.push('OST');
    dataRow.push('0');
    dataRow.push('OST');
    dataRow.push('0');
    dataRow.push(1);
    dataRow.push(0);
    dataRow.push(0);
    dataRow.push(0);
    dataRow.push(0);
    dataRow.push(null);
    dataRow.push(null);
    dataRow.push(null);
    dataRow.push(null);
    dataRow.push(null);
    return this.insertOrUpdateCompanyDataArray([dataRow]);
  },

  /**
   * To insert data in transaction type table
   * @param {Hash} params - parameters
   */
  insertIntoTransactionType: function(params) {
    var oThis = this;
    var contractAddress = params.contract_address.toLowerCase();
    var transactionHash = params.transaction_hash;
    var tag = params.tag;
    return this.getTransactionTypeId(contractAddress, tag)
        .then(function(typeId) {
            if (isNaN(typeId)) {
              return oThis.dbObject.insertIntoTransactionTypeId(contractAddress, tag)
                  .then(function (tagId) {
                      return oThis.dbObject.insertIntoTransactionType(transactionHash, tagId);
                  }).catch(function(){
                      logger.log("Error inserting into TransactionTypeId table");
                      return Promise.reject("Error inserting into TransactionTypeId table");
                  });
            } else {
              return oThis.dbObject.insertIntoTransactionType(transactionHash, typeId);
            }
        });

  },

  /**
   * Get Transaction Type id
   * @param {String} contractAddress - Contract Address
   * @param {String} tag - Type of transaction
   */
  getTransactionTypeId: function(contractAddress, tag) {
      return this.dbObject.selectTransactionTypeId(contractAddress, tag);
  },


  getChainHomeData: function() {
    return this.dbObject.selectChainData();
  },

  getBrandedTokenIdFromContract: function(contract){
    return this.dbObject.selectBrandedTokenIdFromContract(contract);
  },

  getAddressesWithBrandedToken: function(brandedTokenId, pageNumber, PageSize){
    return this.dbObject.selectAddressesWithBrandedToken(brandedTokenId, pageNumber, PageSize);
  },
  getRecentTokenTransactions: function(pageNumebr, pageSize, pagePaylaod){
    return this.dbObject.selectRecentTokenTransactions(pageNumebr, pageSize, pagePaylaod);

  },

  getTopTokens : function(pageNumebr, pageSize, pagePayload) {
    return this.dbObject.selectTopTokens(pageNumebr, pageSize, pagePayload);
  },

  getGraphDataOfBrandedTokenValueTransactions: function(contractAddress){
    return this.dbObject.getGraphDataOfBrandedTokenValueTransactions(contractAddress);
  },



};


// To create Singleton instance of DbHelper of respective chainIDs.
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