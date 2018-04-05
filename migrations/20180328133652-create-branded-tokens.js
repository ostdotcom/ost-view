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
  return createBrandedTokenTable(db)
    .then(function(){
      return createInitialRowsForBrandedTokenTable(db);
    });
};

exports.down = function(db) {
  return deleteBrandedTokenTable(db);
};

//branded-tokens
const createBrandedTokenTable = function (db) {
  return db.createTable(constants.BRANDED_TOKENS_TABLE_NAME, {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    name: {type: 'string', notNull: true},
    contract_address_id: {type: 'bigint', notNull: true, unique:true},
    symbol:{type: 'string', notNull: false},
    uuid: {type: 'string', notNull: false},
    conversion_rate: {type: 'decimal', length:'15,5',notNull: true, default:0},
    symbol_icon: {type:'string', notNull:true, default:0},
    creation_timestamp: {type:'int', notNull: true},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  })
};

const deleteBrandedTokenTable = function (db) {
  return db.dropTable(constants.BRANDED_TOKENS_TABLE_NAME);
};

const createInitialRowsForBrandedTokenTable = function (db) {
  const currentDate = new Date();
  const timestamp = Number(currentDate.getTime()/1000);
  const sqlStatement = "INSERT INTO " + constants.BRANDED_TOKENS_TABLE_NAME + " VALUES (0, 'OST', 0, 'OST', '0', 1, '',"+ timestamp +", NOW(), NOW())";
  return db.runSql(sqlStatement);
};
