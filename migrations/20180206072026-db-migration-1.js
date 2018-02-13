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
  return createAggregateTable(db)
      .then(function (result) { return createAggregateIndexTable(db);})
      .then(function (result) { return createCompanyTokenTable(db);})
      .then(function (result) { return createTransactionTypeTable(db);})
      .then(function (result) { return createAddressTable(db);})
      .then(function (result) { return createAddressIndexTable(db);}
      ,
      function(err) {

      }
  );
};

exports.down = function(db) {
  return db.dropTable(constants.AGGREGATE_TABLE_NAME)
      .then(
      function(result) {
        db.dropTable(constants.BRANDED_TOKEN_TABLE_NAME);
      })
      .then(
      function(result) {
        db.dropTable(constants.TRANSACTION_TYPE_TABLE_NAME);
      })
      .then(
      function(result) {
          db.dropTable(constants.ADDRESS_TABLE_NAME);
      },
      function(err) {

      }
  );
};

exports._meta = {
  "version": 2
};

/**************************** Helper methods *****************************/
var createAggregateTable = function (db) {
  return db.createTable(constants.AGGREGATE_TABLE_NAME, {
    id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
    total_transactions: { type: 'int', notNull: false, default: 0 },
    total_transaction_value: {type: 'decimal', notNull: true, length: '40,0'},
    total_transfers: { type: 'int', notNull: false, default: 0 },
    total_transfer_value: {type: 'decimal', notNull: true, length: '40,0'},
    transaction_type_id: { type: 'int', notNull: false, default: 0 },
    branded_token_id: { type: 'int', notNull: false, default: 0 },
    time_id: { type: 'int', notNull: false, default: 0 }
  });
};

var createAggregateIndexTable = function (db) {
  db.addIndex(constants.AGGREGATE_TABLE_NAME, 'aggregate_index', ['time_id', 'branded_token_id', 'transaction_type_id'], true);
};

var createCompanyTokenTable = function (db) {
  db.createTable(constants.BRANDED_TOKEN_TABLE_NAME, {
    id: {type: 'int', notNull: true, primaryKey: true},
    company_name: { type: 'string', notNull: true , length: 20},
    contract_address: { type: 'string', notNull: true , length: 42},
    company_symbol: { type: 'string', notNull: true , length: 8},
    uuid: { type: 'string', notNull: true , length: 66},
    price: { type: 'int', notNull: true, default: 0 },
    token_holders: { type: 'int', notNull: true, default: 0 },
    market_cap: {type: 'decimal', notNull: true, length: '40,0'},
    circulation: {type: 'decimal', notNull: true, length: '40,0'},
    total_supply: {type: 'decimal', notNull: true, length: '40,0'},
    transactions_data: { type: 'blob', notNull: false},
    transactions_volume_data: { type: 'blob', notNull: false },
    tokens_transfer_data: { type: 'blob', notNull: false },
    tokens_volume_data: { type: 'blob', notNull: false },
    transaction_type_data: { type: 'blob', notNull: false }
  });
};

var createTransactionTypeTable = function (db) {
  db.createTable(constants.TRANSACTION_TYPE_TABLE_NAME, {
    transaction_hash: { type: 'string', notNull: true , length: 66},
    transaction_type_id: { type: 'int', notNull: false, default: 0 },
    transaction_type: { type: 'string', notNull: true , length: 20}
  });
};

var createAddressTable = function (db) {
    db.createTable(constants.ADDRESS_TABLE_NAME, {
        id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
        address: { type: 'string', notNull: true , length: 42},
        branded_token_id: { type: 'int', notNull: true, default: 0 },
        tokens: {type: 'decimal', notNull: true, length: '40,0'},
        tokens_earned: {type: 'decimal', notNull: true, length: '40,0'},
        tokens_spent: {type: 'decimal', notNull: true, length: '40,0'},
        total_transactions: { type: 'int', notNull: true, default: 0 }
    });
};

var createAddressIndexTable = function (db) {
    db.addIndex(constants.ADDRESS_TABLE_NAME, 'address_index', ['address', 'branded_token_id'], true);
};