"use strict";

/*
 * MySQL: Helper file to interact with mysql queries
 * Author: Sachin
 */


var mysql = require('mysql');
const logger = require('../CustomConsoleLogger');

function MySQL() {
	this.con = mysql.createConnection({
  		host: process.env.OST_EXP_DB_HOST,
  		user: process.env.OST_EXP_DB_USER,
 		password: process.env.OST_EXP_DB_PWD,
 		database: process.env.OST_EXP_DB_NAME_STAGE
	});
	this.con.connect(function(err) {
  		if (err) {
  			logger.error(err);
  			throw err;
  		}
  		// logger.info("***************MySQL Connected!*************");
		});
}

MySQL.prototype = {

	/**
	*   data format expected is JSONArray
	*	data = [
		[number_data,
	   	hashdata,
	    parent_hash_data,
	    miner_data,
	    difficulty_data,
	    total_difficulty_data,
	    gas_limit_data,
	    gas_used_data,
	    total_transactions_data,
	    timestamp_data
	    ],
	    [number_data,
	   	hashdata,
	    parent_hash_data,
	    miner_data,
	    difficulty_data,
	    total_difficulty_data,
	    gas_limit_data,
	    gas_used_data,
	    total_transactions_data,
	    timestamp_data
	    ]
	    ];
	*
	*
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

  	releaseConnection: function () {
  		logger.info("Releasing connection");
  		this.con.release();
  	}
}


//To create Singleton 
const mysqlHandle = (function () {
    var instance;
 
    function createInstance() {
        var object = new MySQL();
        return object;
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

module.exports = mysqlHandle;