'use strict';

var dbm;
var type;
var seed;

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
  return createGraphDataTable(db)
    .then(function(){
      return createGraphDataTableIndex(db);
    });
};

exports.down = function(db) {
  return deleteGraphDataTable(db);
};

const createGraphDataTable = function (db) {
  return db.createTable('graph_data', {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    contract_address_id: {type: 'bigint', notNull: true},
    time_frame: {type:'int', notNull: true},
    timestamp: {type:'int', notNull: true},
    branded_token_transaction_type_id: {type: 'bigint', notNull: true},

    total_transactions: {type:'bigint', notNull: true, default: 0},
    total_transaction_value: {type:'decimal', length:'40,0',notNull: false},
    total_transfers: {type:'bigint', notNull: true, default: 0},
    total_transfer_value: {type:'decimal', length:'40,0',notNull: false},
    token_ost_volume: {type:'decimal', length:'40,0',notNull: false},

    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  })
};

const createGraphDataTableIndex = function(db) {
  return db.addIndex('graph_data', 'gd_cai_tf_ti_tti_index', ['contract_address_id', 'time_frame', 'timestamp', 'branded_token_transaction_type_id'], true);
};

const deleteGraphDataTable = function (db) {
  return db.dropTable('graph_data');
};