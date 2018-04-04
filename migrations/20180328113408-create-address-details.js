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
  return createAddressDetailsTable(db)
    .then(function () {
      return createIndexOnAddressDetailsTable(db);
    });
};

exports.down = function(db) {
  return null;
};

//address
//id, address_id, branded_token_id, tokens, tokens_earned, tokens_spent, total_transactions
const createAddressDetailsTable = function (db) {
  return db.createTable(constants.ADDRESS_DETAILS_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    address_id: {type: 'bigint',notNull: true},
    contract_address_id: {type: 'bigint', notNull: true},
    tokens: {type: 'decimal', notNull: true, default:0, length: '40,0'},
    tokens_earned:{type: 'decimal', notNull: true, default:0 ,length: '40,0'},
    tokens_spent: {type: 'decimal', notNull: true,  default:0, length: '40,0'},
    gas_spent: {type: 'decimal', notNull: true,  default:0, length: '40,0'},
    total_transactions: {type: 'bigint', notNull: false},
    total_token_transfers: {type: 'bigint', notNull: false},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  });
};

const createIndexOnAddressDetailsTable = function (db) {
  db.addIndex(constants.ADDRESS_DETAILS_TABLE_NAME, 'ad_ca_ai_index', ['contract_address_id', 'address_id'], true);
  db.addIndex(constants.ADDRESS_DETAILS_TABLE_NAME, 'ad_a_index', 'address_id', false);

};