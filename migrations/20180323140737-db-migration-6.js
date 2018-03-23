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
  return createIndexOnTokenTransactionTable(db);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 7
};

const createIndexOnTokenTransactionTable = function(db) {
  return db.addIndex(constants.TOKEN_TRANSACTION_TABLE_NAME, 'tt_ts_index', 'timestamp', false)
    .then(db.addIndex(constants.TOKEN_TRANSACTION_TABLE_NAME, 'tt_bn_index', 'block_number', false));
};