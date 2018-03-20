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
  return null;
};

exports.down = function(db) {
  return createAggregateStatusTable(db)
    .then(function (result) { return createBlockStatusTable(db);})
    .then(function (result) { return createIndexOnBlockStatusTable(db);})
    .then(function (result) { return createAutoIncrementInTransactionTypeTable(db)}
    ,
    function(err) {
      throw err;
    }
  );
};

exports._meta = {
  "version": 1
};

var createAggregateStatusTable = function(db) {
  return db.createTable(constants.AGGREGATE_STATUS_TABLE_NAME, {
    id: {type: 'int', notNull: true, primaryKey: true, autoIncrement: true},
    step_status: { type: 'int', notNull: true },
    last_updated_bt_ids: { type: 'blob', notNull: false },
    timestamp: { type: 'int', notNull: true }
  });
};

var createBlockStatusTable = function(db) {
  return db.createTable(constants.BLOCK_STATUS_TABLE_NAME, {
    block_number: { type: 'bigint', primaryKey: true },
    step_status: { type: 'int', notNull: true },
    extraData: { type: 'blob', notNull: false }
  });
};

var createIndexOnBlockStatusTable = function(db) {
  return db.addIndex(constants.BLOCK_STATUS_TABLE_NAME, 'b_s_is', 'insertion_status', false);
};

var createAutoIncrementInTransactionTypeTable = function (db) {
  return db.addColumn(constants.TRANSACTION_TYPE_TABLE_NAME, "id", { type: 'int', notNull: true, autoIncrement: true});
};