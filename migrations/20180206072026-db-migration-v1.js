'use strict';

var dbm;
var type;
var seed;

const rootPrefix = '..'
  , constants = require(rootPrefix + '/config/core_constants.js');
/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

// addresses
// id, address (UK), type
// transactions
// id, transaction_hash_id (UK), block_number, transaction_index, contract_address_id, from_address_id, to_address_id, tokens, gas_used, gas_price, nonce, block_timestamp, status
// transaction_extra_details *
// id, transaction_hash_id (UK), input_data, logs, logs_bloom, r, s, v
// token_transactions
// id, transaction_hash_id, block_number, contract_address_id, from_address_id, to_address_id, tokens, block_timestamp
// branded_tokens
// id, contract_address_id, name, symbol, symbol_icon, uuid, conversion_rate, creation_timestamp, (token_holders, market_cap, circulation, total_supply, transactions_data, transactions_volume_data, token_transfer_data, token_volume_data, transaction_type_data, token_transfers, token_ost_volume)
// branded_token_transaction_types
// id, contract_address_id, transaction_type
// branded_token_transaction_type_maps
// id, transaction_hash_id, branded_token_transaction_type_id

exports.up = function (db) {
  return createBlockTable(db)
    .then(function () {
      return createNumberIndexOnBlockTable(db);
    })
  // .then(function (result) { return createHashIndexOnTransactionTable(db);})
  // .then(function (result) { return createTransactionLedgerTable(db);})
  // .then(function (result) { return createGroupIndexOnTxnLedgerTable(db);})
  // .then(function (result) { return createIntTransactionTable(db);})
  // .then(function (result) { return createIndexOnIntTransactionTable(db);})
  // .then(function (result) { return createIntTransactionLedgerTable(db);})
  // .then(function (result) { return createIndexOnIntTxnLedgerTable(db);}
  // ,
  // function(err) {
  //
  // }
  // );
};

exports.down = function(db) {
  return db.dropTable(constants.BLOCK_TABLE_NAME);
  // .then(
  //   function(result) {
  //     	db.dropTable(constants.TRANSACTION_TABLE_NAME);
  //   })
  // .then(
  // 	function(result) {
  // 		db.dropTable(constants.ADDRESS_TRANSACTION_TABLE_NAME);
  // 	})
  // .then(
  // 	function(result) {
  // 		db.dropTable(constants.TOKEN_TRANSACTION_TABLE_NAME);
  // 	})
  // .then(
  // 	function(result) {
  // 		db.dropTable(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME);
  // 	},
  //   function(err) {
  //     return;
  //   }
  // );
};

exports._meta = {
  "version": 1
};

/**************************** Helper methods *****************************/
// id, block_number (UK), block_hash, parent_hash, difficulty, total_difficulty, gas_limit, gas_used, total_transactions, block_timestamp, status
const createBlockTable = function(db) {
	return db.createTable(constants.BLOCK_TABLE_NAME, {
      id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
	    block_number: { type: 'bigint', unique: true },
      block_hash: { type: 'string', notNull: true , length: 66},
	    parent_hash: { type: 'string', notNull: true , length: 66},
	    difficulty: { type: 'string', notNull: true },
	    total_difficulty: { type: 'string', notNull: true },
	    gas_limit: { type: 'int', notNull: true },
	    gas_used: { type: 'int', notNull: true },
	    total_transactions: { type: 'int', notNull: true },
	    block_timestamp: { type: 'int', notNull: true },
      status: { type: 'boolean', notNull: true, default: 0}
  	});
};

// transaction_hashs
// id, transaction_hash (UK), (block_number, block_timestamp)
const createTransactionHashesTable = function(db) {

};

var createTransactionTable = function(db) {
	db.createTable(constants.TRANSACTION_TABLE_NAME, {
        transaction_hash: { type: 'string', primaryKey: true , length: 66},
        block_number: { type: 'bigint', notNull: true },
        transaction_index: { type: 'int', notNull: true },
        contract_address: { type: 'string', notNull: false , length: 42},
        t_from: { type: 'string', notNull: true , length: 42},
        t_to: { type: 'string', notNull: false , length: 42},
        tokens: {type: 'decimal', notNull: true, length: '40,0'},
        gas_used: { type: 'int', notNull: true },
        gas_price: {type: 'decimal', notNull: true, length: '40,0'},
        nounce: { type: 'bigint', notNull: true },
        input_data: { type: 'blob', notNull: false },
        logs: { type: 'blob', notNull: false },
        timestamp: { type: 'int', notNull: true },
        
        /* Optional */
        status: { type: 'string', notNull: false , default: null},
        logs_bloom: { type: 'string', notNull: false , default: null},
        r: { type: 'string', notNull: false , length: 66, default: null },
        s: { type: 'string', notNull: false , length: 66, default: null },
        v: { type: 'string', notNull: false , default: null }
    });
};

var createHashIndexOnTransactionTable = function(db) {
	db.addIndex(constants.TRANSACTION_TABLE_NAME, 'b_index', 'block_number', false);
};

var createTransactionLedgerTable = function(db) {
	db.createTable(constants.ADDRESS_TRANSACTION_TABLE_NAME, {
        id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
        address: { type: 'string', notNull: true , length: 42},
        corresponding_address: { type: 'string', notNull: false , length: 42},
        tokens: {type: 'decimal', notNull: true, length: '40,0'},
        transaction_hash: { type: 'string', notNull: true, length: 66},
        transaction_fees: {type: 'decimal', notNull: true, length: '40,0'},
        inflow: { type: 'boolean', notNull: true},
        timestamp: { type: 'int', notNull: true }
    });
};

var createGroupIndexOnTxnLedgerTable = function(db) {
	db.addIndex(constants.ADDRESS_TRANSACTION_TABLE_NAME, 'a_t_index', ['address','timestamp'], true);
};

var createIntTransactionTable = function(db) {
	db.createTable(constants.TOKEN_TRANSACTION_TABLE_NAME, {
		id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
        transaction_hash: { type: 'string', notNull: true , length: 66},
        contract_address: { type: 'string', notNull: true , length: 42},
        t_from: { type: 'string', notNull: true , length: 42},
        t_to: { type: 'string', notNull: true , length: 42},
        tokens: {type: 'decimal', notNull: true, length: '40,0'},
        timestamp: { type: 'int', notNull: true }
    });
};

var createIndexOnIntTransactionTable = function(db) {
	db.addIndex(constants.TOKEN_TRANSACTION_TABLE_NAME, 'c_t_index', ['contract_address','timestamp'], false);
};

var createIntTransactionLedgerTable = function(db) {
	db.createTable(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, {
		id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
        address: { type: 'string', notNull: true , length: 42},
        corresponding_address: { type: 'string', notNull: true , length: 42},
        tokens: {type: 'decimal', notNull: true, length: '40,0'},
        contract_address: { type: 'string', notNull: true , length: 42},
        transaction_hash: { type: 'string', notNull: true, length: 66},
        inflow: { type: 'boolean', notNull: true },
        timestamp: { type: 'int', notNull: true }
    });
};

var createIndexOnIntTxnLedgerTable = function(db) {
	db.addIndex(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, 'a_index', ['address', 'timestamp'], false);
	db.addIndex(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, 'a_c_t_index', ['address', 'contract_address', 'timestamp'], false);
};