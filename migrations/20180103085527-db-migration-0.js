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
 	.then((result)=> { return createNumberIndexOnBlockTable(db);}) 
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
  		db.dropTable(constants.TRANSACTION_LEDGER_TABLE_NAME);
  	})
  .then(
  	function(result) {
  		db.dropTable(constants.INT_TRANSACTION_TABLE_NAME);
  	})
  .then(
  	function(result) {
  		db.dropTable(constants.INT_TRANSACTION_LEDGER_TABLE_NAME);
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
    number: { type: 'int', primaryKey: true },
    hash: { type: 'string', notNull: true },
    parenthash: 'string',
    miner: 'string',
    difficulty: 'string',
    totaldifficulty: 'string',
    gaslimit: 'int',
    gasUsed: 'int',
    timestamp: 'int'
  });
}

var createNumberIndexOnBlockTable = function(db) {
 	db.addIndex(constants.BLOCK_TABLE_NAME, constants.BLOCK_NUMBER_INDEX, 'number', true);
}

var createTransactionTable = function(db) {
	db.createTable(constants.TRANSACTION_TABLE_NAME, {
        hash: { type: 'string', primaryKey: true },
        blocknumber: 'int',
        from: 'string',
        gas: 'int',
        gasprice: 'int',
        blockhash: 'string',
        nounce: 'string',
        to: 'string',
        transactionIndex: 'int',
        contractAddress: 'string',
        logs: 'blob',
        timestamp: 'int'
    });   
}

var createHashIndexOnTransactionTable = function(db) {
	db.addIndex(constants.TRANSACTION_TABLE_NAME, constants.TRANSACTION_HASH_INDEX, 'hash', true);
}

var createTransactionLedgerTable = function(db) {
	db.createTable(constants.TRANSACTION_LEDGER_TABLE_NAME, {
        address: { type: 'string', notNull: true },
        transactionahash: { type: 'string', notNull: true },
        inout: { type: 'tinyint', notNull: true, length: 1 },
        timestamp: 'int'
    }); 
}

var createGroupIndexOnTxnLedgerTable = function(db) {
	db.addIndex(constants.TRANSACTION_LEDGER_TABLE_NAME, constants.TRANSACTION_LEDGER_ADD_INDEX, ['address','timestamp'], true);
}

var createIntTransactionTable = function(db) {
	db.createTable(constants.INT_TRANSACTION_TABLE_NAME, {
        hash: { type: 'string', notNull: true },
        contract: 'string',
        from: 'string',
        to: 'string',
        value: 'int',
        timestamp: 'int'
    });
}

var createIndexOnIntTransactionTable = function(db) {
	db.addIndex(constants.INT_TRANSACTION_TABLE_NAME, constants.INT_TRANSACTION_HASH_FROM_INDEX, ['hash','from'], false);
	db.addIndex(constants.INT_TRANSACTION_TABLE_NAME, constants.INT_TRANSACTION_HASH_TO_INDEX, ['hash','to'], false);
}

var createIntTransactionLedgerTable = function(db) {
	db.createTable(constants.INT_TRANSACTION_LEDGER_TABLE_NAME, {
        address: { type: 'string', notNull: true },
        transactionhash: 'string',
        from: 'string',
        inout: { type: 'tinyint', notNull: true, length: 1 },
        timestamp: 'int'
    });
}

var createIndexOnIntTxnLedgerTable = function(db) {
	db.addIndex(constants.INT_TRANSACTION_LEDGER_TABLE_NAME, constants.INT_TRANSACTION_LEDGER_ADDRESS_INDEX, ['address', 'timestamp'], false);
}
