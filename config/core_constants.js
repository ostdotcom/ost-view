"use strict";
/**
 * Core Constants file 
 */

const constants = {};

function define(key, value) {
	constants[key] = value;
}

// Available table names
define("BLOCK_TABLE_NAME", 'blocks');
define("TRANSACTION_TABLE_NAME", 'transactions');
define("ADDRESS_TRANSACTION_TABLE_NAME", 'address_transactions');
define("TOKEN_TRANSACTION_TABLE_NAME", 'token_transactions');
define("ADDRESS_TOKEN_TRANSACTION_TABLE_NAME", 'address_token_transactions');
define("AGGREGATE_TABLE_NAME", 'aggregate');
define("BRANDED_TOKEN_TABLE_NAME", 'branded_token');
define("TRANSACTION_TYPE_TABLE_NAME", 'transaction_type');
define("ADDRESS_TABLE_NAME", 'address');
define("TRANSACTION_TYPE_ID_TABLE_NAME", 'transaction_type_id');

// Available columns in tables
define("BLOCKS_DATA_SEQUENCE", '(block_number, block_hash, parent_hash, miner, difficulty, total_difficulty, gas_limit, gas_used, total_transactions, timestamp, verified, nonce, sha3_uncles, uncles, logs_bloom, transactions_root, transactions, state_root, receipt_root, size, extra_data, mix_hash)');
define("TRANSACTION_DATA_SEQUENCE", '(transaction_hash, block_number, transaction_index, contract_address, t_from, t_to, tokens, gas_used, gas_price, nounce, input_data, logs, timestamp, status, logs_bloom, r, s, v)');
define("ADDRESS_TRANSACTION_DATA_SEQUENCE", '(address, corresponding_address, tokens, transaction_hash, transaction_fees, inflow, timestamp)');
define("TOKEN_TRANSACTION_DATA_SEQUENCE", '(transaction_hash, contract_address, t_from, t_to, tokens, timestamp)');
define("ADDRESS_TOKEN_TRANSACTION_DATA_SEQUENCE", '(address, corresponding_address, tokens, contract_address, transaction_hash, inflow, timestamp)');
define("AGGREGATE_DATA_SEQUENCE", '(total_transactions, total_transaction_value, total_transfers, total_transfer_value, transaction_type_id, branded_token_id, time_id)');
define("ADDRESS_DATA_SEQUENCE", '(address.address, address.branded_token_id, address.tokens,address.tokens_earned, address.tokens_spent, address.total_transactions)');
define("BRANDED_TOKEN_DATA_SEQUENCE", '(branded_token.id, branded_token.company_name, branded_token.contract_address, branded_token.company_symbol, ' +
'branded_token.uuid, branded_token.price, branded_token.token_holders, branded_token.market_cap, branded_token.circulation, branded_token.total_supply, ' +
'branded_token.transactions_data, branded_token.transactions_volume_data, branded_token.tokens_transfer_data, branded_token.tokens_volume_data, ' +
'branded_token.transaction_type_data)');

// Index Map
define("TRANSACTION_INDEX_MAP", {'transaction_hash':0, 'block_number':1, 'transaction_index':2, 'contract_address':3, 't_from':4, 't_to':5, 'tokens':6, 'gas_used':7, 'gas_price':8, 'nounce':9, 'input_data': 10, 'logs':11, 'timestamp':12});
define("TOKEN_TRANSACTION_INDEX_MAP", {'transaction_hash':0, 'contract_address':1, 't_from':2, 't_to':3, 'tokens':4, 'timestamp':5});

//constants
define('ACCOUNT_HASH_LENGTH',42);
define('TRANSACTION_HASH_LENGTH', 66);
define('DEFAULT_PAGE_SIZE', 10);
define('DEFAULT_PAGE_NUMBER',1);
define('AGGREGATE_CONSTANT', 5 * 60);

//template map
define("contract_internal_transactions", "transactionList");
define("token_details", "tokenDetails");
define("blocks", "home");
define("transaction", "transactionDetails");
define("block","blockDetail");
define("block_transactions","blockTransactionList");


// JWT details
define('JWT_API_SECRET_KEY', process.env.JWT_API_SECRET_KEY);

module.exports = constants;