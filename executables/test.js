#!/usr/bin/env node

"use strict";

// Load external libraries
const mysql = require('mysql');

// Load internal files
const reqPrefix = ".."
    , constants = require(reqPrefix + '/config/core_constants')
    , logger = require(reqPrefix + '/helpers/custom_console_logger')
    , core_config = require(reqPrefix + "/config")
    , MAIN_MySQL = require(reqPrefix + "/lib/storage/mysql")
    , NUMBER_OF_REC = 5000
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
     * To get transaction data based on provided time interval.
     */
    selectTransactions: function (time1, time2) {
        var oThis = this;

        var query = "select SUM(total_transfers), SUM(total_transfer_value) from aggregate WHERE (time_id BETWEEN ? AND ?) AND company_id=1 GROUP BY transaction_type";

        return new Promise(function (resolve, reject) {
            try {
                oThis.con.query(query,
                    [time1, time2],
                    function (err, result, fields) {
                        if (err) {
                            logger.error(err);
                            reject(err)
                        } else {
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
    }

};

var insertData = function (sql, time) {
    var total_transactions = Math.floor(Math.random() * 10);
    var total_transfers = Math.floor(Math.random() * 30);
    var total_value_transfer = Math.floor(Math.random() * 100) + 1;
    var companyID = Math.floor(Math.random() * 6) + 1;
    var transaction_type = Math.floor(Math.random() * 8) + 1;
    var time_Id = time + Math.floor(Math.random() * 2) - 1;

    var seq = "(total_transactions, total_transfers, total_transfer_value, transaction_type, company_id, time_id)";
    return sql.insertData(constants.AGGREGATE_TABLE, seq, [total_transactions, total_transfers, total_value_transfer, transaction_type, companyID, time_Id]);

};
const execute = function ( records, sql ) {
    console.log("Record  insertion", NUMBER_OF_REC - records);
    if (records > 1) {
        insertData(sql, NUMBER_OF_REC - records)
            .then(function(res) {
                console.log("Record successfully inserted", records - 1 ,res);
                execute(records - 1 ,sql);
            }).catch(function(err){
                console.log("ERROR", err)
            });

    }

};
const db_config = core_config.getChainDbConfig(142);
const mysqlObj = new MySQL(db_config);

//execute(NUMBER_OF_REC, mysqlObj);

var selectExecute = function (mysqlObj) {
    var promise = [];
    var d = new Date();
    var time1 = d.getTime();
    for (var i =0 ;i< 100;i++) {
        promise.push(mysqlObj.selectTransactions(i*20,i*20 + 20));
    }
    Promise.all(promise)
        .then(function(res){
            console.log("Record successfully selected in time", d.getTime() , time1);
        }).catch(function(err){
            console.log("ERROR", err);
        });

};
//selectExecute(mysqlObj);
var executeMysql = function ( mysqlObj ) {
    mysqlObj.selectTransaction('transactions','0x31824e52549b919746a3a110be47a161608546d19247ad5025af54859ffe232c')
        .then(function(res){
            console.log( res[0].logs.toString('utf-8') );
        })
        .catch(function(res){
            console.log(res);
        });
};
executeMysql(new MAIN_MySQL(db_config));
