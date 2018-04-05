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
  return createAddressesTable(db);
};

exports.down = function(db) {
  return deleteAddressesTable(db);
};

// addresses
// id, address (UK), address_type
const createAddressesTable = function (db) {
  return db.createTable(constants.ADDRESSES_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    address_hash: {type: 'string', length: 42, unique: true},
    address_type: {type: 'tinyint', notNull: true, default: 0, length: 1},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  })
};

const deleteAddressesTable = function (db) {
  return db.dropTable(constants.ADDRESSES_TABLE_NAME);
};
