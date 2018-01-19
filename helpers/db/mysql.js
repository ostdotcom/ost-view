"use strict";

/*
 * MySQL: Helper file to interact with mysql queries
 * @module helpers/db/
 */


var mysql = require('mysql');

const reqPrefix           = "../.."
    , logger = require( reqPrefix + '/helpers/CustomConsoleLogger');


/**
 * @constructor
 * MySQL contructor to create connnection with the MySql DB.
 * @param  {JSONObject} dbconfig DB config file
 * @return {Object} MySQL DB object
 */
var MySQL = module.exports = function(dbconfig){
	this.con = mysql.createConnection({
  		host: dbconfig.host,
  		user: dbconfig.user,
 		  password: dbconfig.password,
 		  database: dbconfig.database
	});
	this.con.connect(function(err) {
  		if (err) {
  			logger.error(err);
  			throw err;
  		}
		});
}

MySQL.prototype = {

    /**
     * To get transaction based on provided hash.
     * @param  {String} tableName Table Name
     * @param  {String} transactionHash Hash of the transaction 
     * @return {Promise}
     */
    selectTransaction: function (tableName, transactionHash){
        var oThis = this;

        var query = "SELECT * from " + tableName + " WHERE hash=\'"+ transactionHash+"\'";

        return new Promise(function(resolve, reject){
            try {
              oThis.con.query(query, function (err, result, fields) {
                  if (err) throw err;
                  logger.info(result);
                  console.log(result)
                  resolve(result);
              });
            } catch(err) {
               logger.error(err);
               reject(err)
            }
        });
    },

    /**
     * To get Recent mined blocks
     * @param  {String} tableName Table Name
     * @param  {Integer} pageNumber Page Number
     * @param  {Integer} pageSize Page Size
     * @return {Promise}
     */
    selectRecentBlocks: function (tableName, pageNumber, pageSize){
        var oThis = this;

        var query = "SELECT * from " + tableName + " ORDER BY timestamp DESC LIMIT " + ((pageNumber-1)*pageSize) + "," + pageSize;

        return new Promise(function(resolve, reject){
            try {
              oThis.con.query(query, function (err, result, fields) {
                  if (err) throw err;
                  logger.info(result);
                  resolve(result);
              });
            } catch(err) {
               logger.error(err);
               reject(err)
            }
        });
    },

    /**
     * To get Block based on block Number
     * @param  {String} tableName Table Name
     * @param  {Integer} blockNumber Block Number
     * @return {Promise}
     */
	  selectBlock: function (tableName, blockNumber){
      var oThis = this;

      var query = "SELECT * from " + tableName + " WHERE number="+ blockNumber;
       return new Promise(function(resolve, reject){
              try {
                oThis.con.query(query, function (err, result, fields) {
                    if (err) throw err;
                    logger.info(result);
                    resolve(result);
                });
              } catch(err) {
                 logger.error(err);
                 reject(err)
              }
        });
    },

    /**
     * To get Higest inserted block in the DB.
     * @param  {String} tableName Table Name
     * @return {Promise}
     */
    selectHigestInsertedBlock: function (tableName) {
        var oThis = this;
        logger.log("Getting higest block Number");
        var query = "SELECT MAX(number) from " + tableName;

        return new Promise(function(resolve, reject){
            try {
              oThis.con.query(query, function (err, result, fields) {
                  if (err) throw err;
                  logger.info(result);
                  resolve(result[0]['MAX(number)']);
              });
            } catch(err) {
               logger.error(err);
               reject(err)
            }
        });
    },
    

    /**
     * To get the Leger transactions of particular contract of provided address
     * @param  {String} tableName Table Name
     * @param  {String} address Address
     * @param  {String} contractAddress Contract Address
     * @param  {Integer} pageNumber Page Number
     * @param  {Integer} pageSize Page Size
     * @return {Promise}
     */
    selectAddressLedgerOfContract: function (tableName, address, contractAddress, pageNumber, pageSize){
       var oThis = this;
        logger.log("select for address ledger in contract ");
        logger.log("address ", address) 
        logger.log("contractAddress ", contractAddress);
        logger.log("PageNumber ", pageNumber); 
        logger.log("PageSize ", pageSize);

        var query = "SELECT * from " + tableName + " WHERE address= \'" + address + "\' AND contract_address=\'"+ contractAddress + "\' ORDER BY timestamp DESC LIMIT " + ((pageNumber-1)*pageSize) + "," + pageSize;

        console.log(query);
        return new Promise(function(resolve, reject){
            try {
              oThis.con.query(query, function (err, result, fields) {
                  if (err) throw err;
                  logger.info(result);
                  resolve(result);
              });
            } catch(err) {
               logger.error(err);
               reject(err)
            }
        });
    },

    /**
     * To get the Ledger transactions of particular contract address 
     * @param  {String} tableName Table Name
     * @param  {String} contractAddress Contract Address
     * @param  {Integer} pageNumber Page Number
     * @param  {Integer} pageSize Page Size
     * @return {Promise}
     */
    selectContractLedger: function (tableName, contractAddress, pageNumber, pageSize){
       var oThis = this;
        logger.log("select for contract ledger");
        logger.log("contractAddress ", contractAddress);
        logger.log("PageNumber ", pageNumber); 
        logger.log("PageSize ", pageSize);

        var query = "SELECT * from " + tableName + " WHERE contract_address=\'"+ contractAddress + "\' ORDER BY timestamp DESC LIMIT " + ((pageNumber-1)*pageSize) + "," + pageSize;

        return new Promise(function(resolve, reject){
            try {
              oThis.con.query(query, function (err, result, fields) {
                  if (err) throw err;
                  logger.info(result);
                  resolve(result);
              });
            } catch(err) {
               logger.error(err);
               reject(err)
            }
        });
    },

    /**
     * To get recent Transactions of the mined blocks.
     * @param  {String} tableName Table Name
     * @param  {Integer} pageNumberPage Number
     * @param  {Integer} pageSize Page Size
     * @return {Promise}
     */
    selectRecentTransactions: function (tableName, pageNumber, pageSize) {
        var oThis = this;
        logger.log("select for recent transactions ");
        logger.log("PageNumber ", pageNumber) 
        logger.log("PageSize ", pageSize);
        var query = "SELECT * from " + tableName + " ORDER BY timestamp DESC LIMIT " + ((pageNumber-1)*pageSize) + "," + pageSize;

        return new Promise(function(resolve, reject){
            try {
              oThis.con.query(query, function (err, result, fields) {
                  if (err) throw err;
                  logger.info(result);
                  resolve(result);
              });
            } catch(err) {
               logger.error(err);
               reject(err)
            }
        });

    },

    /**
     * To get List of Transactions of the block based on its provided block number
     * @param  {String} tableName Table Name
     * @param  {Integer} blockNumber Block Number
     * @param  {Integer} pageNumber Page Number
     * @param  {Integer} pageSize Page Size
     * @return {Promise}
     */
    selectBlockTransactions: function (tableName, blockNumber, pageNumber, pageSize) {
        var oThis = this;
        logger.log("select for transaction in block of blockNumber ", blockNumber);
        logger.log("PageNumber ", pageNumber) 
        logger.log("PageSize ", pageSize);
        var query = "SELECT * from " + tableName + " WHERE block_number= " + blockNumber + " LIMIT " + ((pageNumber-1)*pageSize) + "," + pageSize;

        return new Promise(function(resolve, reject){
            try {
              oThis.con.query(query, function (err, result, fields) {
                  if (err) throw err;
                  logger.info(result);
                  resolve(result);
              });
            } catch(err) {
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
      var query = "SELECT * from " + tableName + " WHERE address=\'" + address + "\'" + " LIMIT " + ((pageNumber-1)*pageSize) + "," + pageSize;;
      
      return new Promise(function(resolve, reject){
          try {
            oThis.con.query(query, function (err, result, fields) {
                if (err) throw err;
                logger.info(result);
                resolve(result);
            });
          } catch(err) {
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
  	insertData: function (tableName, columnsSequence ,data) {
  		var oThis = this;
      logger.log("Insert into table", tableName, data);
  			
  		var query = "REPLACE INTO " + tableName + " " + columnsSequence;
      return new Promise(function(resolve, reject){
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
                if (err) throw err;
                logger.info("Insertion in " + tableName + " successful");
                resolve(result);
            });
          } catch(err) {
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
    deleteForTransactions: function (tableName, attributName ,txnHashArray) {
        var oThis = this;
        logger.log("Delete in table", tableName, txnHashArray);
          
        var query = "DELETE  from " + tableName + " WHERE "+ attributName + " IN (?)";
        return new Promise(function(resolve, reject){
            if (txnHashArray == undefined || txnHashArray.length < 1) {
                resolve("No transactions in Array");
                return;
            }

            logger.log(query);
            try {
              oThis.con.query(query, txnHashArray, function (err, result) {
                  if (err) throw err;
                  logger.info("Deletion in " + tableName + " successful");
                  resolve(result);
              });
            } catch(err) {
               logger.error(err);
               reject(err)
            }
        });
    },

    /**
     * To delete Block Data based on provided block number
     * @param  {String} tableName Table Name
     * @param  {String} attributeName Attribute Name
     * @param  {Integer} blockNumber Block Number
     * @return {Promise}
     */
    deleteForBlockNumber: function(tableName, attributName, blockNumber) {
        var oThis = this;
        logger.log("Delete in table", tableName, blockNumber);
          
        var query = "DELETE  from " + tableName + " WHERE "+ attributName + "=?";
        return new Promise(function(resolve, reject){
            if (blockNumber == undefined) {
                resolve("Block Number is undefined");
                return;
            }

            logger.log(query);
            try {
              oThis.con.query(query, blockNumber, function (err, result) {
                  if (err) throw err;
                  logger.info("Deletion in " + tableName + " successful");
                  resolve(result);
              });
            } catch(err) {
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
    updateAttribute: function(tableName, attributName, value, whereAttribute, whereValue) {
        var oThis = this;
        logger.log("Update in table", tableName, attributName, value);
          
        var query = "UPDATE " + tableName + " SET "+ attributName + "=? WHERE " + whereAttribute + "=" + whereValue;
        return new Promise(function(resolve, reject){
            if (value == undefined) {
                resolve("value is undefined");
                return;
            }

            logger.log(query);
            try {
              oThis.con.query(query, value, function (err, result) {
                  if (err) throw err;
                  logger.info("Updation in " + tableName + " successful");
                  resolve(result);
              });
            } catch(err) {
               logger.error(err);
               reject(err)
            }
        });
    },

  	releaseConnection: function () {
  		logger.info("Releasing connection");
  		this.con.release();
  	}
}