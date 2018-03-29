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
  return createAddressTokenTransferTable(db)
    .then(function () {
      return createIndexOnAddressTokenTransferTable(db);
    });
};

exports.down = function(db) {
  return null;
};

//address_token_transfer
//id, address_id, corresponding_address_id, transaction_hash_id, contract_address_id, tokens, inflow, tx_timestamp
const createAddressTokenTransferTable = function (db) {
  return db.createTable(constants.ADDRESS_TOKEN_TRANSFERS_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    address_id: {type: 'bigint', notNull: true},
    corresponding_address_id: {type: 'bigint', notNull: true},
    transaction_hash_id: {type: 'bigint', notNull: true},
    contract_address_id: {type: 'bigint', notNull: false},
    tokens: {type: 'decimal', notNull: true, default:0, length: '40,0'},
    inflow: {type: 'boolean', notNull: true},
    tx_timestamp: {type: 'int', notNull: true},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  });
};

const createIndexOnAddressTokenTransferTable = function (db) {
  db.addIndex(constants.ADDRESS_TOKEN_TRANSFERS_TABLE_NAME, 'att_a_tt_index', ['address_id', 'tx_timestamp'], false);
};



// // branded_tokens
// // id, contract_address_id, name, symbol, symbol_icon, uuid, conversion_rate, creation_timestamp, (token_holders, market_cap, circulation, total_supply, transactions_data, transactions_volume_data, token_transfer_data, token_volume_data, transaction_type_data, token_transfers, token_ost_volume)
// // branded_token_transaction_types
// // id, contract_address_id, transaction_type
// // branded_token_transaction_type_maps
// // id, transaction_hash_id, branded_token_transaction_type_id