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
  return createCronDetailsTable(db)
    .then(function () {
      return createIndexOnCronDetailsTable(db);
    });

  // add initial row for addressProcess Cron
};

exports.down = function(db) {
  return null;
};

//cron_details
//id, cron_name, data, tokens, created_at, updated_at
const createCronDetailsTable = function (db) {
  return db.createTable('cron_details', {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    cron_name: {type: 'string', notNull: true},
    data: {type: 'string'},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  });
};

const createIndexOnCronDetailsTable = function (db) {
  db.addIndex('cron_details', 'cd_cn_index', 'cron_name', true);

};