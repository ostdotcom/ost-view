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
  return createTransactionTable(db)
    .then(function () {
      return createIndexOnTransactionTable(db);
    });
};

exports.down = function(db) {
  return deleteTransactionTable(db);
};

// transactions
// id, transaction_hash_id (UK), block_number, transaction_index, contract_address_id, from_address_id, to_address_id, tokens,gas_used,
// gas_price, nonce, block_timestamp, status
const createTransactionTable = function (db) {
  return db.createTable(constants.TRANSACTIONS_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    transaction_hash_id: {type: 'bigint',notNull: true, unique: true},
    block_number: {type: 'bigint', notNull: true},
    transaction_index: {type: 'int', notNull: true},
    contract_address_id: {type: 'bigint', notNull: false},
    from_address_id: {type: 'bigint', notNull: true},
    to_address_id: {type: 'bigint', notNull: false},
    tokens: {type: 'decimal', notNull: true, length: '40,0'},
    gas_used: {type: 'int', notNull: true},
    gas_price: {type: 'decimal', notNull: true, length: '40,0'},
    nounce: {type: 'bigint', notNull: true},
    block_timestamp: {type: 'int', notNull: true},
    status: {type: 'boolean', notNull: true, default: 0},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  });
};

const createIndexOnTransactionTable = function (db) {
  db.addIndex(constants.TRANSACTIONS_TABLE_NAME, 't_bn_index', 'block_number', false);
};

const deleteTransactionTable = function (db) {
  return db.dropTable(constants.TRANSACTIONS_TABLE_NAME);
};