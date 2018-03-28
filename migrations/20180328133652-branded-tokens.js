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
  return createBrandedTokenTable(db);
};

exports.down = function(db) {
  return null;
};

//branded-tokens
//id, company_name, contract_address_id, company_symbol, uuid, price, token_holders, market_cap, circulation, total_supply, transactions_data
//transactions_volume_data, tokens_volume_data, transaction_type_data, token_transfers, token_ost_volume, creation_time, symbol_icon
const createBrandedTokenTable = function (db) {
  return db.createTable(constants.BRANDED_TOKEN_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    name: {type: 'string', notNull: true, unique:true},
    contract_address_id: {type: 'bigint', notNull: true, unique:true},
    symbol:{type: 'string', notNull: false},
    uuid: {type: 'string', notNull: false},
    price: {type: 'decimal', length:'15,5',notNull: true, default:0},
    symbol_icon: {type:'string', notNull:true, default:0},
    creation_timestamp: {type:'int', notNull: true},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}

    // token_holders: {type : 'int',notNull: false},
    // market_cap: {type:'decimal', length:'40,0',notNull: false},
    // circulation: {type:'decimal', length:'40,0',notNull: false},
    // total_supply: {type:'decimal', length:'40,0',notNull: false},
    // transactions_data: {type: 'blob', notNull: false},
    // transactions_volume_data: {type: 'blob', notNull: false},
    // tokens_volume_data: {type: 'blob', notNull: false},
    // transaction_type_data: {type: 'blob', notNull: false},
    // token_transfers: {type:'decimal', length:'40,0',notNull: false},
    // token_ost_volume: {type:'decimal', length:'40,0',notNull: false},

  })
};
