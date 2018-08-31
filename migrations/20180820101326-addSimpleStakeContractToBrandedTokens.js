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
  return db.addColumn(constants.BRANDED_TOKENS_TABLE_NAME, 'simple_stake_contract_address',
    {type: 'string', notNull: true},function (resp) {
    console.log('simple_stake_contract_address Column added to table ', constants.BRANDED_TOKENS_TABLE_NAME)
  })
};

exports.down = function(db) {
  return db.removeColumn(constants.BRANDED_TOKENS_TABLE_NAME, 'simple_stake_contract_address',
    function (resp) {
    console.log('simple_stake_contract_address Column removed from table ', constants.BRANDED_TOKENS_TABLE_NAME)
  })
};

exports._meta = {
  "version": 1
};
