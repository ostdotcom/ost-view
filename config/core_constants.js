"use strict";
/**
 * Core Constants file 
 */

const constants = {}

function define(key, value) {
	constants[key] = value;
}

// Available table names
define("BLOCK_TABLE_NAME", 'blocks');
define("TRANSACTION_TABLE_NAME", 'transactions');
define("ADDRESS_TRANSACTION_TABLE_NAME", 'address_transactions');
define("TOKEN_TRANSACTION_TABLE_NAME", 'token_transactions');
define("ADDRESS_TOKEN_TRANSACTION_TABLE_NAME", 'address_token_transactions');
define("BRANDED_TOKEN_TABLE_NAME", 'branded_token');
define("ADDRESS_TABLE_NAME", "address");
define("TOKEN_TRANSACTIONS_TABLE_NAME","token_transactions");

// Available columns in tables
define("BLOCKS_DATA_SEQUENCE", '(number, hash, parent_hash, miner, difficulty, total_difficulty, gas_limit, gas_used, total_transactions, timestamp, verified)');
define("TRANSACTION_DATA_SEQUENCE", '(hash, block_number, transaction_index, contract_address, t_from, t_to, tokens, gas_used, gas_price, nounce, input_data, logs, timestamp)');
define("ADDRESS_TRANSACTION_DATA_SEQUENCE", '(address, corresponding_address, tokens, transaction_hash, transaction_fees, inflow, timestamp)');
define("TOKEN_TRANSACTION_DATA_SEQUENCE", '(hash, contract_address, t_from, t_to, tokens, timestamp)');
define("ADDRESS_TOKEN_TRANSACTION_DATA_SEQUENCE", '(address, corresponding_address, tokens, contract_address, transaction_hash, inflow, timestamp)')

// Index Map
define("TRANSACTION_INDEX_MAP", {'hash':0, 'block_number':1, 'transaction_index':2, 'contract_address':3, 't_from':4, 't_to':5, 'tokens':6, 'gas_used':7, 'gas_price':8, 'nounce':9, 'input_data': 10, 'logs':11, 'timestamp':12});
define("TOKEN_TRANSACTION_INDEX_MAP", {'hash':0, 'contract_address':1, 't_from':2, 't_to':3, 'tokens':4, 'timestamp':5});

//constants
define('ACCOUNT_HASH_LENGTH',42);
define('TRANSACTION_HASH_LENGTH', 66);
define('DEFAULT_PAGE_SIZE', 10);
define('DEFAULT_PAGE_NUMBER',1);

//template map
define("contract_internal_transactions", "transactionList");
define("token_details", "tokenDetails");
define("blocks", "home");
define("transaction", "transactionDetails");
define("block","blockDetail");
define("address_details",'addressDetails');
define("home","home");


define("BASE_URL",process.env.BASE_URL);
define("CHAIN_ID",process.env.CHAIN_ID);

module.exports = constants;