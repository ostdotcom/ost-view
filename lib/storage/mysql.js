"use strict";
/**
 * File to interact with MySQL storage engine. File is not directly used, but instead used
 * through {@link module:lib/storage/interact}
 *
 * @module lib/storage/mysql
 */

// Load external libraries
const mysql = require('mysql');

// Load internal files
const reqPrefix = "../.."
  , constants = require(reqPrefix + '/config/core_constants')
  , logger = require(reqPrefix + '/helpers/custom_console_logger')
;

/**
 * Constructor to create connection with the MySQL DB.
 *
 * @param  {Object} dbconfig DB config file
 *
 * @return {Object} MySQL DB object
 *
 * @constructor
 */
var MySQL = module.exports = function (dbconfig) {
  this.con = mysql.createPool({
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
    connectionLimit: dbconfig.connectionLimit
  });
  logger.info("dbconfig.connectionLimit :: " + dbconfig.connectionLimit);
};

MySQL.prototype = {

  /**
   * To get transaction based on provided hash.
   * @param  {String} transactionHash Hash of the transaction
   * @return {Promise}
   */
  selectTransaction: function (tableName, transactionHash) {
    var oThis = this;

    var query = "SELECT * from " + tableName + " WHERE transaction_hash=?";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          transactionHash,
          function (err, result, fields) {
            if (err){
              logger.error(err);
              reject(err)
            } else{ 
              logger.info(result);
              console.log(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To get Recent mined blocks
   * @param  {Integer} pageNumber Page Number
   * @param  {Integer} pageSize Page Size
   * @return {Promise}
   */
  selectRecentBlocks: function (pageNumber, pageSize) {
    var oThis = this;

    var query = "SELECT * from " + constants.BLOCK_TABLE_NAME + " ORDER BY timestamp DESC LIMIT ?,?";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          [((pageNumber - 1) * pageSize), pageSize],
          function (err, result, fields) {
            if (err){
              logger.error(err);
              reject(err)
            } else{ 
              logger.info(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To get Block based on block Number
   * @param  {Integer} blockNumber Block Number
   * @return {Promise}
   */
  selectBlockFromBlockNumber: function (blockNumber) {
    var oThis = this;

    var query = "SELECT * from " + constants.BLOCK_TABLE_NAME + " WHERE block_number=?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          blockNumber,
          function (err, result, fields) {
            if (err){
              logger.error(err);
              reject(err)
            }  else{           
              logger.info(result);
              resolve(result[0]);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To get Block based on block hash
   * @param  {Integer} blockHash Block hash
   * @return {Promise}
   */
  selectBlockFromBlockHash: function (blockHash) {
    var oThis = this;

    var query = "SELECT * from " + constants.BLOCK_TABLE_NAME + " WHERE hash=?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          blockHash,
          function (err, result, fields) {
            if (err){
              logger.error(err);
              reject(err)
            }  else{
              logger.info(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Higest inserted block in the DB.
   *
   * @return {Promise}
   */
  selectHighestInsertedBlock: function () {
    var oThis = this;
    logger.log("Getting higest block Number");
    var query = "SELECT MAX(block_number) from " + constants.BLOCK_TABLE_NAME;

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{  
            logger.info(result);
            resolve(result[0]['MAX(block_number)']);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Lowest UnVerified block number from the DB.
   * 
   * @return {Promise<blockNumber>}
   */
  selectLowestUnVerifiedBlockNumber: function () {
    var oThis = this;
    logger.log("Getting lowest unverified block Number");
    var query = "SELECT MIN(block_number) from " + constants.BLOCK_TABLE_NAME + " WHERE verified=false";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{ 
            logger.info(result);
            resolve(result[0]['MIN(block_number)']);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Last Inserted TimeStamp from aggregate table the DB.
   *
   * @return {Promise<timeStamp>}
   */
  selectAggregateLastInsertedTimeStamp: function () {
    var oThis = this;
    logger.log("Getting last inserted timestamp");
    var query = "SELECT MAX(time_id) from " + constants.AGGREGATE_TABLE_NAME;

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info(result);
            resolve(result[0]['MAX(time_id)']);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Block Number from timeStamp
   *
   * @return {Promise<blockNumber>}
   */
  selectBlockNumberForTimeStamp: function (time_id) {
    var oThis = this;
    logger.log("Getting block number from timestamp");
    var query = "SELECT MIN(block_number) from " + constants.TRANSACTION_TABLE_NAME + " WHERE timestamp>=" + time_id;
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info(result);
            resolve(result[0]['MIN(block_number)']);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get the Leger transactions of particular contract of provided address
   * @param  {String} address Address
   * @param  {String} contractAddress Contract Address
   * @param  {Integer} pageNumber Page Number
   * @param  {Integer} pageSize Page Size
   * @return {Promise}
   */
  selectAddressLedgerOfContract: function (address, contractAddress, pageNumber, pageSize) {
    var oThis = this;
    logger.log("select for address ledger in contract ");
    logger.log("address ", address);
    logger.log("contractAddress ", contractAddress);
    logger.log("PageNumber ", pageNumber);
    logger.log("PageSize ", pageSize);

    var query = "SELECT * from " + constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME + " WHERE address=? AND contract_address=? ORDER BY timestamp DESC LIMIT ?,?";

    console.log(query);
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          [address, contractAddress, ((pageNumber - 1) * pageSize), pageSize],
          function (err, result, fields) {
            if (err) {
              logger.error(err);
              reject(err);
            } else {
              logger.info(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To get the Ledger transactions of particular contract address
   * @param  {String} contractAddress Contract Address
   * @param  {Integer} pageNumber Page Number
   * @param  {Integer} pageSize Page Size
   * @return {Promise}
   */
  selectContractLedger: function (contractAddress, pageNumber, pageSize) {
    var oThis = this;
    logger.log("select for contract ledger");
    logger.log("contractAddress ", contractAddress);
    logger.log("PageNumber ", pageNumber);
    logger.log("PageSize ", pageSize);

    var query = "SELECT * from " + constants.TOKEN_TRANSACTION_TABLE_NAME + " WHERE contract_address=? ORDER BY timestamp DESC LIMIT ?,?";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          [contractAddress, ((pageNumber - 1) * pageSize), pageSize],
          function (err, result, fields) {
            if (err) {
              logger.error(err);
              reject(err);
            } else {
              logger.info(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To get recent Transactions of the mined blocks.
   * @param  {Integer} pageNumber Page Number
   * @param  {Integer} pageSize Page Size
   * @return {Promise}
   */
  selectRecentTransactions: function (pageNumber, pageSize) {
    var oThis = this;
    logger.log("select for recent transactions ");
    logger.log("PageNumber ", pageNumber);
    logger.log("PageSize ", pageSize);
    var query = "SELECT * from " + constants.TRANSACTION_TABLE_NAME + " ORDER BY timestamp DESC LIMIT ?,?";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          [((pageNumber - 1) * pageSize), pageSize],
          function (err, result, fields) {
            if (err){
              logger.error(err);
              reject(err)
            } else{ 
              logger.info(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });

  },

  /**
   * To get List of Transactions of the block based on its provided block number
   * @param  {Integer} blockNumber Block Number
   * @param  {Integer} pageNumber Page Number
   * @param  {Integer} pageSize Page Size
   * @return {Promise}
   */
  getBlockTransactionsFromBlockNumber: function (blockNumber, pageNumber, pageSize) {
    var oThis = this;
    logger.log("select for transaction in block of blockNumber ", blockNumber);
    logger.log("PageNumber ", pageNumber);
    logger.log("PageSize ", pageSize);
    var query = "SELECT * from " + constants.TRANSACTION_TABLE_NAME + " WHERE block_number=? LIMIT ?,?";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          [blockNumber, ((pageNumber - 1) * pageSize), pageSize],
          function (err, result, fields) {
            if (err){
              logger.error(err);
              reject(err)
            } else{ 
              logger.info(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To get List of Transactions of the provided address.
   * @param  {String} tableName Table Name
   * @param  {String} address Address
   * @param  {Integer} pageNumber Page Number
   * @param  {Integer} pageSize page Size
   * @return {Promise}
   */
  selectAddressTransactions: function (tableName, address, pageNumber, pageSize) {
    var oThis = this;
    logger.log("select for transaction address", tableName, address);
    logger.log("PageNumber ", pageNumber);
    logger.log("PageSize ", pageSize);
    var query = "SELECT * from " + tableName + " WHERE address=? LIMIT ?,?";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          [address, ((pageNumber - 1) * pageSize), pageSize],
          function (err, result, fields) {
            if (err){
              logger.error(err);
              reject(err)
            } else{ 
              logger.info(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },


  /**
   * To get List of Transactions of the provided address.
   * @param  {String} contractAddress - contract address
   * @param  {Integer} pageNumber Page Number
   * @param  {Integer} pageSize page Size
   * 
   * @return {Promise}
   */
  getContractTransactions: function (contractAddress, pageNumber, pageSize){
    var oThis = this;
    logger.log("select for transaction address", constants.ADDRESS_TRANSACTION_TABLE_NAME, contractAddress);
    logger.log("PageNumber ", pageNumber)
    logger.log("PageSize ", pageSize);
    var query = "SELECT * from " + constants.ADDRESS_TRANSACTION_TABLE_NAME + " WHERE address=? LIMIT ?,?";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query,
          [contractAddress, ((pageNumber - 1) * pageSize), pageSize],
          function (err, result, fields) {
            if (err){
              logger.error(err);
              reject(err)
            } else{ 
              logger.info(result);
              resolve(result);
            }
          });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },


  /**
   * To insert Data into the provided table based on column sequence
   * @param  {String} tableName Table Name
   * @param  {String} columnsSequence Column Sequence
   * @param  {Array} data Data
   * @return {Promise}
   */
  insertData: function (tableName, columnsSequence, data) {
    var oThis = this;
    logger.log("Insert into table", tableName, data);

    var query = "REPLACE INTO " + tableName + " " + columnsSequence;
    return new Promise(function (resolve, reject) {
      if (data == undefined || data.length < 1) {
        resolve("No data");
        return;
      }

      if (data[0].constructor === Array) {
        query += (" " + "VALUES ?");
      } else {
        query += (" " + "VALUES (?)");
      }
      logger.log(query);
      try {
        oThis.con.query(query, [data], function (err, result) {
          if (err){
            logger.error(err);
            reject(err)
          } else{  
            logger.info("Insertion in " + tableName + " successful");
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To delete transaction data of the provided trnasaction hash array
   * @param  {String} tableName Table Name
   * @param  {String} attributeName Attribute Name
   * @param  {Array} txnHashArray Transaction Hash Array
   * @return {Promise}
   */
  deleteForTransactions: function (tableName, attributeName, txnHashArray) {
    var oThis = this;
    logger.log("Delete in table", tableName, txnHashArray);

    var query = "DELETE  from " + tableName + " WHERE " + attributeName + " IN (?)";
    return new Promise(function (resolve, reject) {
      if (txnHashArray == undefined || txnHashArray.length < 1) {
        resolve("No transactions in Array");
        return;
      }

      logger.log(query);
      try {
        oThis.con.query(query, txnHashArray, function (err, result) {
          if (err){
            logger.error(err);
            reject(err)
          } else{ 
            logger.info("Deletion in " + tableName + " successful");
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To delete Block Data based on provided block number
   * @param  {Integer} blockNumber Block Number
   * @return {Promise}
   */
  deleteForBlockNumber: function (blockNumber) {
    var oThis = this;
    logger.log("Delete in table", constants.BLOCK_TABLE_NAME, blockNumber);

    var query = "DELETE  from " + constants.BLOCK_TABLE_NAME + " WHERE block_number=?";
    return new Promise(function (resolve, reject) {
      if (blockNumber == undefined) {
        resolve("Block Number is undefined");
        return;
      }

      logger.log(query);
      try {
        oThis.con.query(query, blockNumber, function (err, result) {
          if (err){
            logger.error(err);
            reject(err)

          }else{ 
            logger.info("Deletion in " + constants.BLOCK_TABLE_NAME + " successful");
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To update attribute of the table based on where attribute.
   * @param  {String} tableName Table Name
   * @param  {String} attributeName Attribute Name
   * @param  {String} value Value
   * @param  {String} whereAttribute Where Attribute
   * @param  {String} whereValue Where Attribute Value
   * @return {Promise}
   */
  updateAttribute: function (tableName, attributeName, value, whereAttribute, whereValue) {
    var oThis = this;
    logger.log("Update in table", tableName, attributeName, value);

    var query = "UPDATE " + tableName + " SET " + attributeName + "=? WHERE " + whereAttribute + "=" + whereValue;
    return new Promise(function (resolve, reject) {
      if (value == undefined) {
        resolve("value is undefined");
        return;
      }

      logger.log(query);
      try {
        oThis.con.query(query, value, function (err, result) {
          if (err){
            logger.error(err);
            reject(err)
          } else{ 
            logger.info("Updation in " + tableName + " successful");
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Transactions within given timestamps
   * @param {Integer} timestamp1 - timestamp left endpoint
   * @param {Integer} timestamp2 - timestamp right endpoint
   * @returns {Promise}
   */
  selectTransactionsBetweenTimestamp: function(timestamp1, timestamp2) {
    var oThis = this;
    logger.log("Getting transaction within timestamps", timestamp1, timestamp2);
    var query = "SELECT * from " + constants.TRANSACTION_TABLE_NAME + " WHERE timestamp>=? AND timestamp<?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, [timestamp1, timestamp2], function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info(result);
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Transactions type
   * @param {Array} transactionHashes Array of transaction hashes
   * @returns {Promise}
   */
  selectTransactionsType: function (transactionHashes) {
    var oThis = this;
    logger.log("Getting transaction type from  transaction hashes", transactionHashes );
    var query = "SELECT transaction_hash, transaction_type_id FROM " + constants.TRANSACTION_TYPE_TABLE_NAME + " WHERE transaction_hash IN (?)";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, transactionHashes, function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info(result);
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To insert into Address table
   * @param dataArray - Array of rows to be inserted
   * @returns {Promise}
   */
  insertOrUpdateAddressData: function (dataArray) {
    var oThis = this;
    logger.log("Insert into table with data", constants.ADDRESS_TABLE_NAME, dataArray);

    var query = "INSERT INTO " + constants.ADDRESS_TABLE_NAME + " " + constants.ADDRESS_DATA_SEQUENCE +
        " VALUES ? ON DUPLICATE KEY UPDATE address.tokens=address.tokens+VALUES(address.tokens), " +
        "address.tokens_earned=address.tokens_earned+VALUES(address.tokens_earned), " +
        "address.tokens_spent=address.tokens_spent+VALUES(address.tokens_spent), " +
        "address.total_transactions=address.total_transactions+VALUES(address.total_transactions)";

    return new Promise(function (resolve, reject) {
      if (dataArray === undefined || dataArray.length < 1) {
        resolve("No data");
        return;
      }
      logger.log(query);
      try {
        oThis.con.query(query, [dataArray], function (err, result) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info("Insertion in " + constants.ADDRESS_TABLE_NAME + " successful");
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Aggregate data within time stamp
   * @param {Integer} contractId - Contract Id of the company
   * @param {Integer} timeId1 - left bound of timestamp
   * @param {Integer} timeId2 - right bound of timestamp
   * @param {Boolean} groupByTransactionType - should do group by on transaction type
   */
  selectAggregateDataWithinTimestamp: function(contractId, timeId1, timeId2, groupByTransactionType) {
    var oThis = this;
    logger.log("Getting transaction within timestamps", timeId1, timeId2);
    var query;
    if (groupByTransactionType) {
      query = "SELECT b.transaction_type, a.transaction_type_id, SUM(a.total_transactions), SUM(a.total_transaction_value), " +
          "SUM(a.total_transfers), SUM(a.total_transfer_value) from aggregate as a, transaction_type_id as b " +
          "WHERE a.time_id>=? AND a.time_id<? AND a.branded_token_id=? AND b.id = a.transaction_type_id GROUP BY a.transaction_type_id";
    } else {
      query = "SELECT SUM(total_transactions), SUM(total_transaction_value), SUM(total_transfers), SUM(total_transfer_value) from aggregate WHERE time_id>=? AND time_id<? AND branded_token_id=?";
    }

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, [timeId1, timeId2, contractId], function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info(result);
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   *
   */
  insertOrUpdateCompanyData: function(dataArray) {
    var oThis = this;
    logger.log("Insert into table with data", constants.BRANDED_TOKEN_TABLE_NAME, dataArray);

console.log("********\n\n\n\n\n\n\n\n insertion data :: ", dataArray);

    var query = "INSERT INTO " + constants.BRANDED_TOKEN_TABLE_NAME + " " + constants.BRANDED_TOKEN_DATA_SEQUENCE +
        " VALUES ? ON DUPLICATE KEY UPDATE branded_token.company_name=VALUES(branded_token.company_name), branded_token.company_symbol=VALUES(branded_token.company_symbol), branded_token.uuid=VALUES(branded_token.uuid), " +
        "branded_token.price=VALUES(branded_token.price), branded_token.token_holders=VALUES(branded_token.token_holders), " +
        "branded_token.market_cap=VALUES(branded_token.market_cap), branded_token.circulation=VALUES(branded_token.circulation), " +
        "branded_token.total_supply=VALUES(branded_token.total_supply), branded_token.transactions_data=VALUES(branded_token.transactions_data), " +
        "branded_token.transactions_volume_data=VALUES(branded_token.transactions_volume_data), branded_token.tokens_transfer_data=VALUES(branded_token.tokens_transfer_data), " +
        "branded_token.tokens_volume_data=VALUES(branded_token.tokens_volume_data), branded_token.transaction_type_data=VALUES(branded_token.transaction_type_data)";

    return new Promise(function (resolve, reject) {
      if (dataArray == undefined || dataArray.length < 1) {
        resolve("No data");
        return;
      }
      logger.log(query);
      try {
        oThis.con.query(query, [dataArray], function (err, result) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info("Insertion in " + constants.BRANDED_TOKEN_TABLE_NAME + " successful");
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Total Number of token Details of given company token id
   * @param {Integer} companyTokenId - Company Token Id
   * @returns {Promise}
   */
  selectTotalTokenDetails: function(companyTokenId) {
    var oThis = this;
    logger.log("Getting total tokens holders of company token id ", companyTokenId);
    var query = "SELECT SUM(tokens), COUNT(*) from " + constants.ADDRESS_TABLE_NAME + " WHERE branded_token_id=?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, companyTokenId ,function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info(result);
            resolve({tokenHolders:result[0]['COUNT(*)'] == null ? 0 : result[0]['COUNT(*)'] , tokenCirculation: result[0]['SUM(tokens)'] == null ? 0:result[0]['SUM(tokens)']});
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Graph Branded Token value Transactions
   * @param contractAddress
   * @returns {Promise}
   */
  getGraphDataOfBrandedTokenValueTransactions: function (contractAddress) {
    var oThis = this;
    logger.log("Getting graph of branded token contract address", contractAddress);
    var query = "SELECT tokens_transfer_data FROM " + constants.BRANDED_TOKEN_TABLE_NAME + " WHERE contract_address=?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, contractAddress, function (err, result, fields) {
          if (err) {
            logger.error(err);
            reject(err)
          } else {
            if (result !== undefined && result.length > 0) {
              resolve(JSON.parse(result[0]['tokens_transfer_data'].toString()));
            } else {
              resolve();
            }
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get values and volumes of Branded Token Transactions
   * @param brandedTokenId Branded Token Id
   * @returns {Promise}
   */
  selectValuesAndVolumesOfBrandedTokenTransactions: function (brandedTokenId) {
    var oThis = this;
    logger.log("Getting graph of branded token contract address ", brandedTokenId);
    var query = "SELECT tokens_volume_data FROM " + constants.BRANDED_TOKEN_TABLE_NAME + " WHERE id=?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, brandedTokenId, function (err, result, fields) {
          if (err) {
            logger.error(err);
            reject(err)
          } else {
              resolve(JSON.parse(result[0]['tokens_volume_data'].toString()));
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err);
      }
    });
  },


  /**
   * Get data for branded token transactions by type
   * @param  {String} brandedTokenId - branded Token Id
   *
   * @return {Promise}
   */
  selectDataForBrandedTokenTransactionsByType: function (brandedTokenId) {
    var oThis = this;
    logger.log("Getting graph of branded token Id TransactionsByType", brandedTokenId);
    var query = "SELECT transaction_type_data FROM " + constants.BRANDED_TOKEN_TABLE_NAME + " WHERE id=?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, brandedTokenId, function (err, result, fields) {
          if (err) {
            logger.error(err);
            reject(err)
          } else {
            if (result !== undefined && result.length > 0) {
              resolve(JSON.parse(result[0]['transaction_type_data'].toString()));
            } else {
              resolve();
            }
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To get top  users for given contract address.
   * @param  {String} brandedTokenId - Branded Token Id
   * @return {Promise}
   */
  selectBrandedTokenTopUsers: function(brandedTokenId){
    var oThis = this;
    logger.log("Getting total tokens holders of company token id ", brandedTokenId);
    var query = "SELECT * FROM " + constants.ADDRESS_TABLE_NAME + " WHERE branded_token_id=? order by tokens desc limit 10";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, brandedTokenId ,function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To get OST supply for given contract address.
   * @param  {String} companyTokenId - Company Token Id
   *
   * @return {Promise}
   */
  getOstSupply: function(companyTokenId) {
    var oThis = this;
    logger.log("Getting total tokens holders of company token id ", companyTokenId);
    var query = "select total_supply from branded_token where id=?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, companyTokenId, function (err, result, fields) {
          if (err) {
            logger.error(err);
            reject(err)
          } else {
            logger.info(result);
            resolve(result[0]["total_supply"]);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Branded token Details.
   * @returns {Promise}
   */
  selectBrandedTokenDetails: function () {
    var oThis = this;
    logger.log("Getting branded token details");
    var query = "SELECT * from " + constants.BRANDED_TOKEN_TABLE_NAME;
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, function (err, result, fields) {
          if (err) {
            logger.error(err);
            reject(err)
          } else {
            logger.info(result);
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * Get Transaction Type id
   * @param {String} contractAddress - Contract Address
   * @param {String} tag - Type of transaction
   */
  selectTransactionTypeId: function (contractAddress, tag) {
    var oThis = this;
    logger.log("Getting Type Id of ", contractAddress, tag);
    var query = "SELECT id FROM "+ constants.TRANSACTION_TYPE_ID_TABLE_NAME + " WHERE contract_address=? AND transaction_type=?";
    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, [contractAddress, tag] ,function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info(result['id']);
            resolve(result['id']);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To insert data into Transaction type Id table
   * @param {String} contractAddress - Contract Address
   * @param {String} tag - Type of transaction
   */
  insertIntoTransactionTypeId: function (contractAddress, tag) {
    var oThis = this;
    logger.log("Insert into table ", constants.TRANSACTION_TYPE_ID_TABLE_NAME);

    var query = "INSERT INTO " + constants.TRANSACTION_TYPE_ID_TABLE_NAME + " (contract_address, transaction_type) VALUES (?)";
    return new Promise(function (resolve, reject) {
      logger.log(query);
      try {
        oThis.con.query(query, [[contractAddress, tag]], function (err, result) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info("Insertion in " + constants.TRANSACTION_TYPE_ID_TABLE_NAME + " successful");
            resolve(result['insertId']);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  },

  /**
   * To Insert data into Transaction Type table
   * @param {String} transactionHash - Transaction hash
   * @param {Integer} tagId - Tag Id
   */
  insertIntoTransactionType: function(transactionHash, tagId) {
    var oThis = this;
    logger.log("Insert into table ", constants.TRANSACTION_TYPE_TABLE_NAME);

    var query = "INSERT INTO " + constants.TRANSACTION_TYPE_TABLE_NAME + " (transaction_hash, transaction_type_id) VALUES (?)";
    return new Promise(function (resolve, reject) {
      logger.log(query);
      try {
        oThis.con.query(query, [[transactionHash, tagId]], function (err, result) {
          if (err){
            logger.error(err);
            reject(err)
          } else{
            logger.info("Insertion in " + constants.TRANSACTION_TYPE_TABLE_NAME + " successful");
            resolve(result);
          }
        });
      } catch (err) {
        logger.error(err);
        reject(err)
      }
    });
  }

};