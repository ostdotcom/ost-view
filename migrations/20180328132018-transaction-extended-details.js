'use strict';

var dbm;
var type;
var seed;

const rootPrefix = '..'
  , constants = require(rootPrefix + '/config/core_constants.js')
;

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
  return createTransactionExtendedDetailsTable(db);
};

exports.down = function(db) {
  return null;
};

//transaction_extra_details
//id, transaction_hash_id (UK), input_data, logs, logs_bloom, r, s, v

const createTransactionExtendedDetailsTable = function (db) {
  return db.createTable(constants.TRANSACTION_EXTENDED_DETAILS_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    transaction_hash_id: {type: 'bigint', notNull: true, unique:true},
    input_data:{type: 'blob', notNull: false},
    logs:{type: 'blob', notNull: false},
    logs_bloom:{type: 'string', notNull: false},
    r:{type: 'string', notNull: false},
    s:{type: 'string', notNull: false},
    v:{type: 'string', notNull: false},

  })
}