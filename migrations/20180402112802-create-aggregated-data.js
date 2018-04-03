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
  return createAggregatedTable(db);
};

exports.down = function(db) {
  return null;
};

const createAggregatedTable = function (db) {
  return db.createTable(constants.AGGREGATED_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    branded_token_transaction_type_id: {type: 'bigint', notNull: true},
    timestamp: {type:'int', notNull: true},
    total_transactions: {type:'bigint', notNull: true, default: 0},
    total_transaction_value: {type:'decimal', length:'40,0',notNull: false},
    total_transfers: {type:'bigint', notNull: true, default: 0},
    total_transfer_value: {type:'decimal', length:'40,0',notNull: false},
    token_ost_volume: {type:'decimal', length:'40,0',notNull: false},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  })
};
