'use strict';

var dbm;
var type;
var seed;

const constants = require('../config/core_constants.js');

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return addBrandedTokenTableRequiredAttributes(db)
    .then(function () {
      return addTokenAddressTableRequiredAttributes(db);
    })
    .then(function () {
      return addAggregateTableRequiredAttributes(db);
    });
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  "version": 4
};

var addBrandedTokenTableRequiredAttributes = function (db) {
  return db.addColumn(constants.BRANDED_TOKEN_TABLE_NAME, "symbol_icon", {
    type: 'string',
    notNull: false,
    length: '255'
  });
};

var addTokenAddressTableRequiredAttributes = function (db) {
  return db.addColumn(constants.TOKEN_TRANSACTION_TABLE_NAME, "block_number", {type: 'bigint', notNull: true, default: 0});
};

var addAggregateTableRequiredAttributes = function (db) {
  return db.addColumn(constants.AGGREGATE_TABLE_NAME, "token_ost_volume", {
    type: 'decimal',
    notNull: true,
    length: '40,0',
    default: 0
  });
};