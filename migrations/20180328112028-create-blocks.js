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
  return createBlocksTable(db);
};

exports.down = function(db) {
  return null;
};

// blocks
// id, block_number (UK), block_hash, parent_hash, difficulty, total_difficulty, gas_limit, gas_used, total_transactions, block_timestamp, status
const createBlocksTable = function (db) {
  return db.createTable(constants.BLOCKS_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    block_number: {type: 'bigint', unique: true, notNull: true},
    block_hash: {type: 'string', notNull: true, length: 66},
    parent_hash: {type: 'string', notNull: true, length: 66},
    difficulty: {type: 'string', notNull: true},
    total_difficulty: {type: 'string', notNull: true},
    gas_limit: {type: 'int', notNull: true},
    gas_used: {type: 'int', notNull: true},
    total_transactions: {type: 'int', notNull: true},
    block_timestamp: {type: 'int', notNull: true},
    verified: {type: 'tinyint', notNull: true, length:1},
    status: {type: 'tinyint', notNull: true, length:1},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  });
};