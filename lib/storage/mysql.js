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
}

MySQL.prototype = {

  /**
   * To get transaction based on provided hash.
   * @param  {String} transactionHash Hash of the transaction
   * @return {Promise}
   */
  selectTransaction: function (transactionHash) {
    var oThis = this;

    var query = "SELECT * from " + constants.TRANSACTION_TABLE_NAME + " WHERE hash=?";

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
              console.log(result)
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

    var query = "SELECT * from " + constants.BLOCK_TABLE_NAME + " WHERE number=?";
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
  selectHigestInsertedBlock: function () {
    var oThis = this;
    logger.log("Getting higest block Number");
    var query = "SELECT MAX(number) from " + constants.BLOCK_TABLE_NAME;

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{  
            logger.info(result);
            resolve(result[0]['MAX(number)']);
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
    var query = "SELECT MIN(number) from " + constants.BLOCK_TABLE_NAME + " WHERE verified=false";

    return new Promise(function (resolve, reject) {
      try {
        oThis.con.query(query, function (err, result, fields) {
          if (err){
            logger.error(err);
            reject(err)
          } else{ 
            logger.info(result);
            resolve(result[0]['MIN(number)']);
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
    logger.log("address ", address)
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
   * @param  {Integer} pageNumberPage Number
   * @param  {Integer} pageSize Page Size
   * @return {Promise}
   */
  selectRecentTransactions: function (pageNumber, pageSize) {
    var oThis = this;
    logger.log("select for recent transactions ");
    logger.log("PageNumber ", pageNumber)
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
    logger.log("PageNumber ", pageNumber)
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
    logger.log("PageNumber ", pageNumber)
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
  deleteForTransactions: function (tableName, attributName, txnHashArray) {
    var oThis = this;
    logger.log("Delete in table", tableName, txnHashArray);

    var query = "DELETE  from " + tableName + " WHERE " + attributName + " IN (?)";
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

    var query = "DELETE  from " + constants.BLOCK_TABLE_NAME + " WHERE number=?";
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
  updateAttribute: function (tableName, attributName, value, whereAttribute, whereValue) {
    var oThis = this;
    logger.log("Update in table", tableName, attributName, value);

    var query = "UPDATE " + tableName + " SET " + attributName + "=? WHERE " + whereAttribute + "=" + whereValue;
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
  }
  
}