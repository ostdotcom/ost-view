'use strict';

var dbm;
var type;
var seed;

const   rootPrefix = ".."
  , CronDetailKlass = require(rootPrefix + "/app/models/cron_detail")
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
  return createCronDetailsTable(db)
    .then(function () {
      return createInitialRowsForCronDetail(db);
    });
};

exports.down = function(db) {
  return deleteCronDetailsTable(db);
};

//cron_details
//id, cron_name, data, tokens, created_at, updated_at
const createCronDetailsTable = function (db) {
  return db.createTable('cron_details', {
    id: {type: 'bigint', notNull: true, primaryKey: true, autoIncrement: true},
    cron_name: {type: 'string', notNull: true},
    data: {type: 'string'},
    status: {type: 'tinyInt'},
    created_at:{type: 'datetime', notNull: true},
    updated_at:{type: 'datetime', notNull: true}
  });
};

const createInitialRowsForCronDetail = function (db) {
  var currentDate = new Date();
  var cronData = JSON.stringify({block_number: 0, start_from_index: 0});
  var sqlStatement = "INSERT INTO CRON_DETAILS(cron_name, data, created_at, updated_at) VALUES('" + CronDetailKlass.address_detail_populate_cron + "', '"+ cronData + "', NOW(), NOW() ) ";
  db.runSql(sqlStatement);
};

const deleteCronDetailsTable = function (db) {
  return db.dropTable('cron_details');
};
