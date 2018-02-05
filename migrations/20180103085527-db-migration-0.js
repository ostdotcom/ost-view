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
	return createBlockTable(db)
  	.then(function (result) { return createTransactionTable(db);})
  	.then(function (result) { return createHashIndexOnTransactionTable(db);})
  	.then(function (result) { return createTransactionLedgerTable(db);})
  	.then(function (result) { return createGroupIndexOnTxnLedgerTable(db);})
  	.then(function (result) { return createIntTransactionTable(db);})
  	.then(function (result) { return createIndexOnIntTransactionTable(db);})
  	.then(function (result) { return createIntTransactionLedgerTable(db);})
  	.then(function (result) { return createIndexOnIntTxnLedgerTable(db);})
    .then(function (result) { return createAggregateTable(db);})
    .then(function (result) { return createAggregateIndexTable(db);})
    .then(function (result) { return createCompanyTable(db);})
    .then(function (result) { return createTransactionTypeTable(db);}
  	,
    function(err) {

    }
  );
};

exports.down = function(db) {
  return db.dropTable(constants.BLOCK_TABLE_NAME)
  .then(
    function(result) {
      	db.dropTable(constants.TRANSACTION_TABLE_NAME);
    })
  .then(
  	function(result) {
  		db.dropTable(constants.ADDRESS_TRANSACTION_TABLE_NAME);
  	})
  .then(
  	function(result) {
  		db.dropTable(constants.TOKEN_TRANSACTION_TABLE_NAME);
  	})
  .then(
  	function(result) {
  		db.dropTable(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME);
  	})
  .then(
    function(result) {
        db.dropTable(constants.AGGREGATE_TABLE_NAME);
    })
  .then(
    function(result) {
        db.dropTable(constants.COMPANY_TABLE_NAME);
    })
  .then(
    function(result) {
        db.dropTable(constants.TRANSACTION_TYPE_TABLE_NAME);
    },
    function(err) {
      return;
    }
  );
};

exports._meta = {
  "version": 1
};

/**************************** Helper methods *****************************/
var createBlockTable = function(db) {
	return db.createTable(constants.BLOCK_TABLE_NAME, {
	    block_number: { type: 'bigint', primaryKey: true },
	    block_hash: { type: 'string', notNull: true , length: 66},
	    parent_hash: { type: 'string', notNull: true , length: 66},
	    miner: { type: 'string', notNull: true , length: 42},
	    difficulty: { type: 'string', notNull: true },
	    total_difficulty: { type: 'string', notNull: true },
	    gas_limit: { type: 'int', notNull: true },
	    gas_used: { type: 'int', notNull: true },
	    total_transactions: { type: 'int', notNull: true },
	    timestamp: { type: 'int', notNull: true },
        verified: { type: 'boolean', notNull: true, default: 0},

        /* Optionals */
        nonce: { type: 'string', notNull: false , length: 16, default: null },
        sha3_uncles: { type: 'string', notNull: false , length: 66, default: null },
        uncles:  { type: 'blob', notNull: false, default: null },
        logs_bloom: { type: 'string', notNull: false , default: null },
        transactions_root: { type: 'string', notNull: false , length: 66, default: null },
        transactions: { type: 'blob', notNull: false, default: null },
        state_root: { type: 'string', notNull: false , length: 66, default: null },
        receipt_root : { type: 'string', notNull: false , length: 66, default: null },
        size: { type: 'int', notNull: false, default: 0 },
        extra_data: { type: 'string', notNull: false , default: null },
        mix_hash: { type: 'string', notNull: false , default: null }
  	});
};

var createNumberIndexOnBlockTable = function(db) {
 	db.addIndex(constants.BLOCK_TABLE_NAME, 'n_index', 'block_number', true);
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

var createAggregateTable = function (db) {
    db.createTable(constants.AGGREGATE_TABLE_NAME, {
        id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
        total_transactions: { type: 'int', notNull: false, default: 0 },
        total_transaction_value: { type: 'int', notNull: false, default: 0 },
        total_transfers: { type: 'int', notNull: false, default: 0 },
        total_transfer_value: { type: 'int', notNull: false, default: 0 },
        transaction_type: { type: 'int', notNull: false, default: 0 },
        company_token_id: { type: 'int', notNull: false, default: 0 },
        time_id: { type: 'int', notNull: false, default: 0 }
    });
};

var createAggregateIndexTable = function (db) {
    db.addIndex(constants.AGGREGATE_TABLE_NAME, 'aggregate_index', ['time_id', 'company_token_id', 'transaction_type'], true);
};

var createCompanyTable = function (db) {
    db.createTable(constants.COMPANY_TABLE_NAME, {
        id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
        company_name: { type: 'string', notNull: true , length: 20},
        contract_address: { type: 'string', notNull: true , length: 42},
        company_symbol: { type: 'string', notNull: true , length: 8}
    });
};

var createTransactionTypeTable = function (db) {
    db.createTable(constants.TRANSACTION_TYPE_TABLE_NAME, {
        transaction_hash: { type: 'string', primaryKey: true , length: 66},
        transaction_id: { type: 'int', notNull: false, default: 0 },
        transaction_type: { type: 'string', notNull: true , length: 20}
    });
};