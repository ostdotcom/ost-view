var mysql = require('mysql');
const logger = require('../CustomConsoleLogger');

function MySQL() {
	var con = mysql.createConnection({
  		host: process.env.OST_EXP_DB_HOST,
  		user: process.env.OST_EXP_DB_USER,
 		password: process.env.OST_EXP_DB_PWD
	});
	con.connect(function(err) {
  		if (err) {
  			logger.error(err);
  			throw err;
  		}
  		logger.info("***************MySQL Connected!*************");
		});
}

MySQL.prototype = {
  	createTable: function (tableName) {
  		logger.info("Create Table", tableName);
  	},
  	dropTable: function (tableName) {
    	logger.info("Create Table", tableName);
  	},
  	insertOrUpdateData: function (tableName, data) {
  		logger.info("Insert Table", tableName, data);
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