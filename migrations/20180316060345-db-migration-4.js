'use strict';

var dbm;
var type;
var seed;

const constants = require('../config/core_constants.js');

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return createIndexOnTransactionTable(db) 
    .then(function(result){ 
      return createIndexOnTokenTransactionTable(db); 
    })
    .then(function(result){
      return removeIndexOnAddressTransactionTable(db);
    })
    .then(function(result){
      return createIndexOnAddressTransactionTable(db);
    });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 5
};

var createIndexOnTransactionTable = function(db) { 
  return db.addIndex(constants.TRANSACTION_TABLE_NAME, 't_ts_index', 'timestamp', false);
};

var createIndexOnTokenTransactionTable = function(db) { 
  return db.addIndex(constants.TOKEN_TRANSACTION_TABLE_NAME, 'c_ttx_index', 'transaction_hash', false);
 };

var removeIndexOnAddressTransactionTable = function(db) {

  return db.removeIndex(constants.ADDRESS_TRANSACTION_TABLE_NAME, 'a_t_index');
};
var createIndexOnAddressTransactionTable = function(db) {

  return db.addIndex(constants.ADDRESS_TRANSACTION_TABLE_NAME, 'a_t_index', ['address', 'timestamp'], false);
};
