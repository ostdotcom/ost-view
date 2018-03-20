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
  return createAutoIncrementInTransactionTypeTable(db);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 6
};

const createAutoIncrementInTransactionTypeTable = function (db) {
  return db.runSql('ALTER TABLE '+constants.TRANSACTION_TYPE_TABLE_NAME+' DROP PRIMARY KEY;')
    .then(db.addColumn(constants.TRANSACTION_TYPE_TABLE_NAME, "id", { type: 'int', notNull: true}))
    .then(db.runSql('ALTER TABLE '+constants.TRANSACTION_TYPE_TABLE_NAME+' MODIFY id INT NOT NULL PRIMARY KEY AUTO_INCREMENT;'));
};