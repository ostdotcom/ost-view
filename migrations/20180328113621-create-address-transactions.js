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
  return createAddressTransactionsTable(db)
    .then(function () {
      return createIndexOnAddressTransactionTable(db);
    });
};

exports.down = function(db) {
  return deleteAddressTransactionsTable(db);
};

//address_transactions
//id, address_id, corresponding_address_id, tokens, transaction_hash_id, transaction_fees, inflow, tx_timestamp
const createAddressTransactionsTable = function (db) {
  return db.createTable(constants.ADDRESS_TRANSACTIONS_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    address_id: {type: 'bigint', notNull: true },
    corresponding_address_id: {type: 'bigint', notNull: false },
    transaction_hash_id: {type: 'bigint', notNull: true, length: 66},
    tokens: {type: 'decimal', notNull: true, default:0, length: '40,0'},
    transaction_fees: {type: 'decimal', notNull: true, default:0, length: '40,0'},
    inflow: {type: 'boolean', notNull: true},
    tx_timestamp: {type: 'int', notNull: true},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  });
};

const createIndexOnAddressTransactionTable = function (db) {
  db.addIndex(constants.ADDRESS_TRANSACTIONS_TABLE_NAME, 'at_a_tt_index', ['address_id', 'tx_timestamp'], false);
  db.addIndex(constants.ADDRESS_TRANSACTIONS_TABLE_NAME, 'at_thi_index', 'transaction_hash_id', false);
};

const deleteAddressTransactionsTable = function (db) {
  return db.dropTable(constants.ADDRESS_TRANSACTIONS_TABLE_NAME);
};