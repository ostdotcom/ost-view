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
  return createTokenTransferTable(db)
    .then(function () {
      return createIndexOnTokenTransferTable(db);
    });
};

exports.down = function(db) {
  return deleteTokenTransferTable(db);
};

// tokenTransfer
// id, transaction_hash_id, block_number, contract_address_id, from_address_id, to_address_id, tokens, block_timestamp
const createTokenTransferTable = function (db) {
  return db.createTable(constants.TOKEN_TRANSFERS_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    transaction_hash_id: {type: 'bigint', notNull: true},
    block_number: {type: 'bigint', notNull: true},
    contract_address_id: {type: 'bigint', notNull: false},
    from_address_id: {type: 'bigint', notNull: true},
    to_address_id: {type: 'bigint', notNull: false},
    tokens: {type: 'decimal', notNull: true, length: '40,0'},
    block_timestamp: {type: 'int', notNull: true},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  });
};

const createIndexOnTokenTransferTable = function (db) {
  db.addIndex(constants.TOKEN_TRANSFERS_TABLE_NAME, 'tt__ca_bt_index', ['contract_address_id', 'block_timestamp'], false);
  db.addIndex(constants.TOKEN_TRANSFERS_TABLE_NAME, 'tt__bn_index', ['block_number'], false);
  db.addIndex(constants.TOKEN_TRANSFERS_TABLE_NAME, 'tt__tx_index', ['transaction_hash_id'], false);

};

const deleteTokenTransferTable = function (db) {
  return db.dropTable(constants.TOKEN_TRANSFERS_TABLE_NAME);
};