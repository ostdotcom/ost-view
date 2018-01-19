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
  	.then((result)=> { return createTransactionTable(db);})
  	.then((result)=> { return createHashIndexOnTransactionTable(db);})
  	.then((result)=> { return createTransactionLedgerTable(db);})
  	.then((result)=> { return createGroupIndexOnTxnLedgerTable(db);})
  	.then((result)=> { return createIntTransactionTable(db);})
  	.then((result)=> { return createIndexOnIntTransactionTable(db);})
  	.then((result)=> { return createIntTransactionLedgerTable(db);})
  	.then((result)=> { return createIndexOnIntTxnLedgerTable(db);}
  	,
    function(err) {
      return;
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
	    number: { type: 'bigint', primaryKey: true },
	    hash: { type: 'string', notNull: true , length: 66},
	    parent_hash: { type: 'string', notNull: true , length: 66},
	    miner: { type: 'string', notNull: true , length: 42},
	    difficulty: { type: 'string', notNull: true },
	    total_difficulty: { type: 'string', notNull: true },
	    gas_limit: { type: 'int', notNull: true },
	    gas_used: { type: 'int', notNull: true },
	    total_transactions: { type: 'int', notNull: true },
	    timestamp: { type: 'int', notNull: true },
      verified: { type: 'boolean', notNull: true, default: 0}
  	});
}

var createNumberIndexOnBlockTable = function(db) {
 	db.addIndex(constants.BLOCK_TABLE_NAME, 'n_index', 'number', true);
}

var createTransactionTable = function(db) {
	db.createTable(constants.TRANSACTION_TABLE_NAME, {
        hash: { type: 'string', primaryKey: true , length: 66},
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
        timestamp: { type: 'int', notNull: true }
    });   
}

var createHashIndexOnTransactionTable = function(db) {
	db.addIndex(constants.TRANSACTION_TABLE_NAME, 'b_index', 'block_number', false);
}

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
}

var createGroupIndexOnTxnLedgerTable = function(db) {
	db.addIndex(constants.ADDRESS_TRANSACTION_TABLE_NAME, 'a_t_index', ['address','timestamp'], true);
}

var createIntTransactionTable = function(db) {
	db.createTable(constants.TOKEN_TRANSACTION_TABLE_NAME, {
		id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
        hash: { type: 'string', notNull: true , length: 66},
        contract_address: { type: 'string', notNull: true , length: 42},
        t_from: { type: 'string', notNull: true , length: 42},
        t_to: { type: 'string', notNull: true , length: 42},
        tokens: {type: 'decimal', notNull: true, length: '40,0'},
        timestamp: { type: 'int', notNull: true }
    });
}

var createIndexOnIntTransactionTable = function(db) {
	db.addIndex(constants.TOKEN_TRANSACTION_TABLE_NAME, 'c_t_index', ['contract_address','timestamp'], false);
}

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
}

var createIndexOnIntTxnLedgerTable = function(db) {
	db.addIndex(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, 'a_index', ['address', 'timestamp'], false);
	db.addIndex(constants.ADDRESS_TOKEN_TRANSACTION_TABLE_NAME, 'a_c_t_index', ['address', 'contract_address', 'timestamp'], false);
}
