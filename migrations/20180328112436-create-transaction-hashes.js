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
  return createTransactionHashesTable(db);
};

exports.down = function(db) {
  return null;
};

// transaction_hashes
// id, transaction_hash (UK), (block_number, block_timestamp)
const createTransactionHashesTable = function (db) {
  return db.createTable(constants.TRANSACTIONS_HASHES_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    transaction_hash: {type: 'string',notNull: true, length: 66, unique: true},
    transaction_type_id:{type: 'int', notNull:false},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  })
};
