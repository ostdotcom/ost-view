"use strict";

/*
 * Constants file: Load constants
 *
 */


const constants = {}

function define(key, value) {
	constants[key] = value;
}

define("BLOCK_TABLE_NAME", 'blocks');
define("BLOCK_NUMBER_INDEX", 'block_number_index');

define("TRANSACTION_TABLE_NAME", 'transactions');
define("TRANSACTION_HASH_INDEX", 'transaction_hash_index');

define("TRANSACTION_LEDGER_TABLE_NAME", 'transaction_ledger');
define("TRANSACTION_LEDGER_ADD_INDEX", 'transaction_address_index');

define("INT_TRANSACTION_TABLE_NAME", 'int_transaction');
define("INT_TRANSACTION_LEDGER_TABLE_NAME", 'int_transaction_ledger');
define("INT_TRANSACTION_HASH_FROM_INDEX", 'int_transaction_hash_from_index');
define("INT_TRANSACTION_HASH_TO_INDEX", 'int_transaction_hash_to_index');
define("INT_TRANSACTION_LEDGER_ADDRESS_INDEX", 'int_transaction_ledger_address_index');


module.exports = constants;