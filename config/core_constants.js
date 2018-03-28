"use strict";
/**
 * Core Constants file
 */

const constants = {};

function define(key, value) {
	constants[key] = value;
}

// Available table names
define('BLOCK_TABLE_NAME', 'blocks');
define('TRANSACTION_TABLE_NAME', 'transactions');
define('TRANSACTION_EXTENDED_DETAILS_TABLE_NAME','transaction_extended_details');
define('TOKEN_TRANSACTION_TABLE_NAME', 'token_transfers');
define('ADDRESS_TABLE_NAME', 'address_details');
define('ADDRESS_TRANSACTION_TABLE_NAME', 'address_transactions');
define('ADDRESS_TOKEN_TRANSACTION_TABLE_NAME', 'address_token_transfers');

define('ADDRESSES_TABLE_NAME','addresses');
define('TRANSACTIONS_HASHES_TABLE_NAME','transaction_hashes')

define('BRANDED_TOKEN_TABLE_NAME', 'branded_tokens');
define('AGGREGATE_TABLE_NAME', 'aggregates');
define('TRANSACTION_TYPE_TABLE_NAME', 'transaction_type');
define('TRANSACTION_TYPE_ID_TABLE_NAME', 'branded_token_transaction_types');
define('BLOCK_STATUS_TABLE_NAME', 'block_status');
define('AGGREGATE_STATUS_TABLE_NAME', 'aggregate_status');

// Available columns in tables
define('BLOCKS_DATA_SEQUENCE', '(block_number, block_hash, parent_hash, miner, difficulty, total_difficulty, gas_limit, gas_used, total_transactions, timestamp, verified, nonce, sha3_uncles, uncles, logs_bloom, transactions_root, transactions, state_root, receipt_root, size, extra_data, mix_hash)');
define('BLOCKS_DATA_SEQUENCE_ARRAY', ['block_number', 'block_hash', 'parent_hash', 'miner', 'difficulty', 'total_difficulty', 'gas_limit', 'gas_used', 'total_transactions', 'timestamp', 'verified', 'nonce', 'sha3_uncles', 'uncles', 'logs_bloom', 'transactions_root', 'transactions', 'state_root', 'receipt_root', 'size', 'extra_data', 'mix_hash']);
define('TRANSACTION_DATA_SEQUENCE', '(transaction_hash, block_number, transaction_index, contract_address, t_from, t_to, tokens, gas_used, gas_price, nounce, input_data, logs, timestamp, status, logs_bloom, r, s, v)');
define('ADDRESS_TRANSACTION_DATA_SEQUENCE', '(address, corresponding_address, tokens, transaction_hash, transaction_fees, inflow, timestamp)');
define('TOKEN_TRANSACTION_DATA_SEQUENCE', '(transaction_hash, contract_address, t_from, t_to, tokens, timestamp, block_number)');
define('ADDRESS_TOKEN_TRANSACTION_DATA_SEQUENCE', '(address, corresponding_address, tokens, contract_address, transaction_hash, inflow, timestamp)');
define('AGGREGATE_DATA_SEQUENCE', '(total_transactions, total_transaction_value, total_transfers, total_transfer_value, transaction_type_id, branded_token_id, time_id, token_ost_volume)');
define('ADDRESS_DATA_SEQUENCE', '(address.address, address.branded_token_id, address.tokens,address.tokens_earned, address.tokens_spent, address.total_transactions)');
define('BRANDED_TOKEN_DATA_SEQUENCE', '(branded_token.id, branded_token.company_name, branded_token.contract_address, branded_token.company_symbol, ' +
'branded_token.uuid, branded_token.price, branded_token.token_holders, branded_token.market_cap, branded_token.circulation, branded_token.total_supply, ' +
'branded_token.transactions_data, branded_token.transactions_volume_data, branded_token.tokens_transfer_data, branded_token.tokens_volume_data, ' +
'branded_token.transaction_type_data, branded_token.token_transfers, branded_token.token_ost_volume, branded_token.creation_time, branded_token.symbol_icon)');

// Index Map
define('TRANSACTION_INDEX_MAP', {'transaction_hash':0, 'block_number':1, 'transaction_index':2, 'contract_address':3, 't_from':4, 't_to':5, 'tokens':6, 'gas_used':7, 'gas_price':8, 'nounce':9, 'input_data': 10, 'logs':11, 'timestamp':12});
define('TOKEN_TRANSACTION_INDEX_MAP', {'transaction_hash':0, 'contract_address':1, 't_from':2, 't_to':3, 'tokens':4, 'timestamp':5, 'block_number': 6});

//constants
define('ACCOUNT_HASH_LENGTH',42);
define('TRANSACTION_HASH_LENGTH', 66);
define('DEFAULT_PAGE_SIZE', 10);
define('DEFAULT_PAGE_NUMBER',1);
define('AGGREGATE_CONSTANT', 5 * 60);
define('TOP_TOKENS_LIMIT_COUNT',500);
define('FETCHER_BATCH_SIZE', 2);

//template map
define('contract_internal_transactions', 'transactionList');
define('token_details', 'tokenDetails');
define('blocks', 'home');
define('transaction', 'transactionDetails');
define('block','blockDetail');
define('address_details','addressDetails');
define('home','home');
define('search_results','searchResult');



define('BASE_URL',process.env.BASE_URL);
//TODO::Should be removed and used from config object
define('CHAIN_ID',process.env.CHAIN_ID);
define('BASE_CONTRACT_ADDRESS',process.env.BASE_CONTRACT_ADDRESS);
define('DEFAULT_DATA_NOT_AVAILABLE_TEXT','Data not available. Please check the input parameters.');

// JWT details
define('JWT_API_SECRET_KEY', process.env.JWT_API_SECRET_KEY);

//Cache
define('CACHING_ENGINE', process.env.OST_CACHING_ENGINE);



define('DEFAULT_MYSQL_HOST', process.env.OV_DEFAULT_MYSQL_HOST);
define('DEFAULT_MYSQL_USER', process.env.OV_DEFAULT_MYSQL_USER);
define('DEFAULT_MYSQL_PASSWORD', process.env.OV_DEFAULT_MYSQL_PASSWORD);


//Basic auth

define('ENVIRONMENT',process.env.NODE_ENV);

module.exports = constants;