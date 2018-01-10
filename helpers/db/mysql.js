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
  		logger.info("***************MySQL Connected!*************");
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
    selectAddressTransactions: function (tableName, address) {
      var oThis = this;
      logger.log("select for transaction address", tableName, address);
      var query = "SELECT * from " + tableName + " WHERE address=\'" + address + "\'";
      
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

  	insertData: function (tableName, columnsSequence ,data, callback) {
  		var oThis = this;
      logger.log("Insert into table", tableName, data);
  			
  		var query = "REPLACE INTO " + tableName + " " + columnsSequence;
  		if (data[0].constructor === Array) {
  			query += (" " + "VALUES ?");
  		} else {
  			query += (" " + "VALUES (?)");	
  		}
  		logger.log(query);
      return new Promise(function(resolve, reject){
          try {
            oThis.con.query(query, [data], function (err, result) {
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

  	updateData: function (tableName, data) {
  		logger.log("Update into table", tableName, data);
  		//var sql = "UPDATE "+ tableName +" SET address = 'Canyon 123' WHERE address = 'Valley 345'";
  		var sql = '';
  		return con.query( sql );
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