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
  return addBrandedTokenTableRequiredAttributes(db)
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 3
};

var addBrandedTokenTableRequiredAttributes = function (db) {
  return db.addColumn(constants.BRANDED_TOKEN_TABLE_NAME, "token_transfers", {type: 'decimal', notNull: true, length: '40,0'})
    .then(function(){
      return db.addColumn(constants.BRANDED_TOKEN_TABLE_NAME, "token_ost_volume", {type: 'decimal', notNull: true, length: '40,5'})
    })
    .then(function(){
      return db.addColumn(constants.BRANDED_TOKEN_TABLE_NAME, "creation_time", { type: 'int', notNull: true, default: 0 })
    });
};