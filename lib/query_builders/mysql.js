"use strict";

/**
 *
 * Form mysql query <br><br>
 *
 *
 * Max supported SELECT query:
 * SELECT [columns]
 *   FROM [table]
 *   WHERE [where conditions]
 *   GROUP BY [columns]
 *   ORDER BY [order by columns]
 *   HAVING [having condition]
 *   LIMIT [limit and offset];
 *
 * Max supported INSERT query:
 * INSERT INTO [table] ([columns])
 *   VALUES ([values]), ([values])
 *   ON DUPLICATE KEY UPDATE [conditions];
 *
 * Max supported UPDATE query:
 * UPDATE [table]
 *   SET [column=value], [column=value]
 *   WHERE [where conditions]
 *   ORDER BY [order by columns]
 *   LIMIT [limit];
 *
 * Max supported DELETE query:
 * DELETE FROM [table]
 *   WHERE [where conditions]
 *   ORDER BY [order by columns]
 *   LIMIT [limit];
 *
 * @module lib/query_builder/mysql
 *
 */

var rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Use following to test for SELECT after any changes in file
 *
 *
 var mysqlQuery = require('./lib/query_builders/mysql');
 var mysqlWrapper = require('./lib/mysql_wrapper');
 var mysql = require('mysql');
 var dbName = 'saas_client_economy_sandbox_development';
 var tableName = 'client_branded_tokens';

 function queryBuilder() {
  return new mysqlQuery({table_name: tableName});
 }
 function printQuery(query, queryData) {
  var sql = mysql.format(query, queryData);
  return sql;
 }

 var queryResponse = queryBuilder().select().select().select(['client_id']).select(['id', 'name']).select('sum(id) as total').select('created_at').where(['id IN (?) AND created_at > ?', [1,2], '2018-02-19']).where(['symbol_icon IN (?) AND symbol IS ?', ['ST1', 'ST2'], null]).where('symbol IS NULL').where('name="ST1"').where({conversion_rate: [1,2,3], symbol: 'ST1'}).where({conversion_rate: 2}).group_by(['id','token_uuid']).group_by(['symbol']).group_by('name, created_at').group_by('updated_at').order_by('id ASC').having(['MIN(`id`) < ? and max(id) > ?', 20, 200]).having(['MIN(`id`) < ? and max(id) > ?', 10, 100]).having('SUM(`id`) < 10').having('SUM(`id`) < 100').order_by('client_id DESC').order_by(['name', 'reserve_managed_address_id']).order_by(['symbol']).order_by({id: 'asc', client_id: 'desc'}).order_by({symbol: 'AsC'}).limit(10).offset(20).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery == "SELECT client_branded_tokens.*, client_branded_tokens.*, `client_id`, `id`, `name`, sum(id) as total, created_at FROM `client_branded_tokens` WHERE (id IN (1, 2) AND created_at > '2018-02-19') AND (symbol_icon IN ('ST1', 'ST2') AND symbol IS NULL) AND (symbol IS NULL) AND (name=\"ST1\") AND (`conversion_rate` IN (1, 2, 3) AND `symbol`='ST1') AND (`conversion_rate`=2) GROUP BY `id`, `token_uuid`, `symbol`, name, created_at, updated_at HAVING (MIN(`id`) < 20 and max(id) > 200) AND (MIN(`id`) < 10 and max(id) > 100) AND (SUM(`id`) < 10) AND (SUM(`id`) < 100) ORDER BY id ASC, client_id DESC, `name`, `reserve_managed_address_id`, `symbol`, `id` ASC, `client_id` DESC, `symbol` ASC LIMIT 20, 10";
 *
 *
 */

/**
 *  Use following to test for UPDATE after any changes in file
 *
 *
 var mysqlQuery = require('./lib/query_builders/mysql');
 var mysqlWrapper = require('./lib/mysql_wrapper');
 var mysql = require('mysql');
 var dbName = 'saas_client_economy_sandbox_development';
 var tableName = 'client_branded_tokens';

 function queryBuilder() {
  return new mysqlQuery({table_name: tableName});
 }
 function printQuery(query, queryData) {
  var sql = mysql.format(query, queryData);
  return sql;
 }

 var queryResponse = queryBuilder().update(['name=?, id=?', 'ACMA', 10], {touch: false}).update(['name=?, id=?', '1', 1000]).update({name: 'CMA', id: 0}).update({name: 'MA', id: 110}).update('id=30').update('id=40').where(['id IN (?) AND created_at > ?', [1,2], '2018-02-19']).where(['symbol_icon IN (?) AND symbol IS ?', ['ST1', 'ST2'], null]).where('symbol IS NULL').where('name="ST1"').where({conversion_rate: [1,2,3], symbol: 'ST1'}).where({conversion_rate: 2}).order_by('id ASC').order_by('client_id DESC').order_by(['name', 'reserve_managed_address_id']).order_by(['symbol']).order_by({id: 'asc', client_id: 'desc'}).order_by({symbol: 'AsC'}).limit(10).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery == "UPDATE `client_branded_tokens` SET name='ACMA', id=10, name='1', id=1000, `name`='CMA', `id`=0, `name`='MA', `id`=110, id=30, id=40 WHERE (id IN (1, 2) AND created_at > '2018-02-19') AND (symbol_icon IN ('ST1', 'ST2') AND symbol IS NULL) AND (symbol IS NULL) AND (name=\"ST1\") AND (`conversion_rate` IN (1, 2, 3) AND `symbol`='ST1') AND (`conversion_rate`=2) ORDER BY id ASC, client_id DESC, `name`, `reserve_managed_address_id`, `symbol`, `id` ASC, `client_id` DESC, `symbol` ASC LIMIT 10";

 var queryResponse = queryBuilder().update(['name=?, id=?', 'ACMA', 10]).update(['name=?, id=?', '1', 1000]).update({name: 'CMA', id: 0}).update({name: 'MA', id: 110}).update('id=30').update('id=40').where(['id IN (?) AND created_at > ?', [1,2], '2018-02-19']).where(['symbol_icon IN (?) AND symbol IS ?', ['ST1', 'ST2'], null]).where('symbol IS NULL').where('name="ST1"').where({conversion_rate: 3, symbol: 'ST1'}).where({conversion_rate: 2}).order_by('id ASC').order_by('client_id DESC').order_by(['name', 'reserve_managed_address_id']).order_by(['symbol']).order_by({id: 'asc', client_id: 'desc'}).order_by({symbol: 'AsC'}).limit(10).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery.includes("UPDATE `client_branded_tokens` SET name='ACMA', id=10, name='1', id=1000, `name`='CMA', `id`=0, `name`='MA', `id`=110, id=30, id=40, updated_at='");
 *
 *
 */

/**
 * Use following to test for DELETE after any changes in file
 *
 *
 var mysqlQuery = require('./lib/query_builders/mysql');
 var mysqlWrapper = require('./lib/mysql_wrapper');
 var mysql = require('mysql');
 var dbName = 'saas_client_economy_sandbox_development';
 var tableName = 'client_branded_tokens';

 function queryBuilder() {
  return new mysqlQuery({table_name: tableName});
 }
 function printQuery(query, queryData) {
  var sql = mysql.format(query, queryData);
  return sql;
 }

 var queryResponse = queryBuilder().delete().where(['id IN (?) AND created_at > ?', [1,2], '2018-02-19']).where(['symbol_icon IN (?) AND symbol IS ?', ['ST1', 'ST2'], null]).where('symbol IS NULL').where('name="ST1"').where({conversion_rate: 3, symbol: 'ST1'}).where({conversion_rate: 2}).order_by('id ASC').order_by('client_id DESC').order_by(['name', 'reserve_managed_address_id']).order_by(['symbol']).order_by({id: 'asc', client_id: 'desc'}).order_by({symbol: 'AsC'}).limit(10).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery == "DELETE FROM `client_branded_tokens` WHERE (id IN (1, 2) AND created_at > '2018-02-19') AND (symbol_icon IN ('ST1', 'ST2') AND symbol IS NULL) AND (symbol IS NULL) AND (name=\"ST1\") AND (`conversion_rate`=3 AND `symbol`='ST1') AND (`conversion_rate`=2) ORDER BY id ASC, client_id DESC, `name`, `reserve_managed_address_id`, `symbol`, `id` ASC, `client_id` DESC, `symbol` ASC LIMIT 10";

 var queryResponse = queryBuilder().delete().order_by('id ASC').order_by('client_id DESC').order_by(['name', 'reserve_managed_address_id']).order_by(['symbol']).order_by({id: 'asc', client_id: 'desc'}).order_by({symbol: 'AsC'}).limit(10).generate();
 var finalQuery = printQuery(queryResponse.data.dangerQuery, queryResponse.data.queryData);
 finalQuery == "DELETE FROM `client_branded_tokens` ORDER BY id ASC, client_id DESC, `name`, `reserve_managed_address_id`, `symbol`, `id` ASC, `client_id` DESC, `symbol` ASC LIMIT 10";
 *
 *
 */

/**
 * Use following to test for INSERT after any changes in file
 *
 *
 var mysqlQuery = require('./lib/query_builders/mysql');
 var mysqlWrapper = require('./lib/mysql_wrapper');
 var mysql = require('mysql');
 var dbName = 'saas_client_economy_sandbox_development';
 var tableName = 'client_branded_tokens';

 function queryBuilder() {
  return new mysqlQuery({table_name: tableName});
 }
 function printQuery(query, queryData) {
  var sql = mysql.format(query, queryData);
  return sql;
 }

 var queryResponse = queryBuilder().insert({name: 'a', age: 21}, {touch: false}).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery == "INSERT INTO `client_branded_tokens` (`name`, `age`) VALUES ('a', 21)";

 var queryResponse = queryBuilder().insert({name: 'a', age: 21}, {touch: false}).onDuplicate({name: 'aman', age: 25}).onDuplicate(['name=?, age=?', 'a', 100]).onDuplicate('id = 7, id2 = 74').generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery == "INSERT INTO `client_branded_tokens` (`name`, `age`) VALUES ('a', 21) ON DUPLICATE KEY UPDATE `name`='aman', `age`=25, name='a', age=100, id = 7, id2 = 74";

 var queryResponse = queryBuilder().insert({name: 'a', age: 21}).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery.includes("INSERT INTO `client_branded_tokens` (`name`, `age`, `updated_at`, `created_at`) VALUES ('a', 21, '");

 var queryResponse = queryBuilder().insert({name: 'a', age: 21, created_at: '2018-01-01 00:00:00'}).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery.includes("INSERT INTO `client_branded_tokens` (`name`, `age`, `created_at`, `updated_at`) VALUES ('a', 21, '2018-01-01 00:00:00', '");

 var queryResponse = queryBuilder().insert({name: 'a', age: 21, created_at: '2018-01-01 00:00:00', updated_at: '2018-01-02 00:00:00'}).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery.includes("INSERT INTO `client_branded_tokens` (`name`, `age`, `created_at`, `updated_at`) VALUES ('a', 21, '2018-01-01 00:00:00', '2018-01-02 00:00:00')");
 *
 */

/**
 * Use following to test for INSERT MULTIPLE after any changes in file
 *
 *
 var mysqlQuery = require('./lib/query_builders/mysql');
 var mysqlWrapper = require('./lib/mysql_wrapper');
 var mysql = require('mysql');
 var dbName = 'saas_client_economy_sandbox_development';
 var tableName = 'client_branded_tokens';

 function queryBuilder() {
  return new mysqlQuery({table_name: tableName});
 }
 function printQuery(query, queryData) {
  var sql = mysql.format(query, queryData);
  return sql;
 }

 var queryResponse = queryBuilder().insertMultiple(['name', 'age'], [['a', 21], ['b', 22]], {touch: false}).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery == "INSERT INTO `client_branded_tokens` (`name`, `age`) VALUES ('a', 21), ('b', 22)";

 var queryResponse = queryBuilder().insertMultiple(['name', 'age'], [['a', 21], ['b', 22]], {touch: false}).onDuplicate({name: 'aman', age: 25}).onDuplicate(['name=?, age=?', 'a', 100]).onDuplicate('id = 7, id2 = 74').generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery == "INSERT INTO `client_branded_tokens` (`name`, `age`) VALUES ('a', 21), ('b', 22) ON DUPLICATE KEY UPDATE `name`='aman', `age`=25, name='a', age=100, id = 7, id2 = 74";

 var queryResponse = queryBuilder().insertMultiple(['name', 'age'], [['a', 21], ['b', 22]]).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery.includes("INSERT INTO `client_branded_tokens` (`name`, `age`, `updated_at`, `created_at`) VALUES ('a', 21, '");

 var queryResponse = queryBuilder().insertMultiple(['name', 'age', 'created_at'], [['a', 21, '2018-01-01 00:00:00'], ['b', 22, '2018-01-01 10:00:00']]).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery.includes("INSERT INTO `client_branded_tokens` (`name`, `age`, `created_at`, `updated_at`) VALUES ('a', 21, '2018-01-01 00:00:00', '");

 var queryResponse = queryBuilder().insertMultiple(['name', 'age', 'created_at', 'updated_at'], [['a', 21, '2018-01-01 00:00:00', '2018-01-02 00:00:00'], ['b', 22, '2018-01-01 10:00:00', '2018-01-02 10:00:00']]).generate();
 var finalQuery = printQuery(queryResponse.data.query, queryResponse.data.queryData);
 finalQuery.includes("INSERT INTO `client_branded_tokens` (`name`, `age`, `created_at`, `updated_at`) VALUES ('a', 21, '2018-01-01 00:00:00', '2018-01-02 00:00:00'), ('b', 22, '2018-01-01 10:00:00', '2018-01-02 10:00:00')");
 *
 */


/**
 *
 * MySQL query builder constructor
 *
 * @param {Object} params -
 * @param {String} [params.table_name] - MySQL table name for which query need to be build
 *
 * @constructor
 *
 */
const MySQLQueryBuilderKlass = function (params) {
  const oThis = this
  ;

  oThis.tableName = oThis.tableName || (params || {}).table_name;

  oThis.queryType = null;

  // Select query type
  oThis.selectSubQueries = [];
  oThis.selectSubQueriesReplacement = [];

  // Insert, Bulk Insert query type
  oThis.insertIntoColumns = [];
  oThis.insertIntoColumnValues = [];

  // Update query type
  oThis.updateSubQueries = [];
  oThis.updateSubQueriesReplacement = [];
  oThis.touchUpdatedAt = true;

  // delete Query type has no specific parameters

  // --- common variables ---

  //used in Select, Delete, Update Query
  oThis.whereSubQueries = [];
  oThis.whereSubQueriesReplacement = [];

  //used in Select, Delete, Update Query
  oThis.orderBySubQueries = [];
  oThis.orderBySubQueriesReplacement = [];

  //used in Select, Delete, Update Query
  oThis.selectLimit = 0;

  //used only with Select Query
  oThis.selectOffset = 0;

  //used only with Select Query
  oThis.groupBySubQueries = [];
  oThis.groupBySubQueriesReplacement = [];

  //used only with Select Query
  oThis.havingSubQueries = [];
  oThis.havingSubQueriesReplacement = [];

  //used only with INSERT Query
  oThis.onDuplicateSubQueries = [];
  oThis.onDuplicateSubQueriesReplacement = [];

  return oThis;
};

MySQLQueryBuilderKlass.prototype = {

  tableName: null,

  queryType: null,

  selectSubQueries: null,
  selectSubQueriesReplacement: null,

  insertIntoColumns: null,
  insertIntoColumnValues: null,

  updateSubQueries: null,
  updateSubQueriesReplacement: null,
  touchUpdatedAt: null,

  whereSubQueries: null,
  whereSubQueriesReplacement: null,

  orderBySubQueries: null,
  orderBySubQueriesReplacement: null,

  selectLimit: null,
  selectOffset: null,

  groupBySubQueries: null,
  groupBySubQueriesReplacement: null,

  havingSubQueries: null,
  havingSubQueriesReplacement: null,

  onDuplicateSubQueries: null,
  onDuplicateSubQueriesReplacement: null,

  /**
   * List of fields to be selected from table. If called multiple times, select columns will be joined by COMMA.
   *
   * Possible data types:
   * * blank/undefined - '*' will be used to fetch all columns
   * * Array - list of field names will be joined by comma
   * * String - list of field names will be used as it is
   *
   * Example 1: '*' will be used to fetch all columns
   * select()
   *
   * Example 2: list of field names in array. Will be joined by comma
   * select(['name', 'created_at'])
   *
   * Example 3: list of field names in string. Will be used as it is
   * select('name, created_at')
   *
   * @return {object<self>} oThis
   */
  select: function (fields) {
    const oThis = this
    ;

    if (![undefined, null, '', 'SELECT'].includes(oThis.queryType)) {
      throw "Multiple type of query statements in single query builder object";
    }

    oThis.queryType = "SELECT";

    if (fields === undefined || fields === '') {

      // if fields are not mentioned, fetch all columns
      oThis.selectSubQueries.push(oThis.tableName + ".*");

    } else if (Array.isArray(fields)) {

      // list of columns will be fetched
      oThis.selectSubQueries.push("??");
      oThis.selectSubQueriesReplacement.push(fields);

    } else if (typeof fields === 'string') {

      // custom columns list will be fetched
      oThis.selectSubQueries.push(fields);

    } else {
      throw "Unsupported data type for fields in SELECT clause";
    }

    return oThis;
  },

  /**
   * Insert single record in table. Method can't be called twice on same object
   *
   * Example 1: Insert in object format.
   * insert({name: 'ACMA', id: 10})
   *
   * @param (object) insertFields - key and value pairs of columns and values to be inserted
   * @param (object) insertOptions -
   * @param (object) [insertOptions.touch] - if true, auto insert created_at and updated_at values. Default is true.
   *
   * @return {object<self>} oThis
   */
  insert: function (insertFields, insertOptions) {
    const oThis = this;

    if (typeof insertFields !== 'object') {
      throw "Unsupported INSERT fields data type";
    }

    var insertColumns = Object.keys(insertFields)
      , insertValues = Object.values(insertFields)
    ;

    return oThis.insertMultiple(insertColumns, [insertValues], insertOptions);
  },

  /**
   * Insert multiple records in table. Method can't be called twice on same object
   *
   * Example 1:
   * insertMultiple(['name', 'symbol'], [['ABC', '123'], ['ABD', '456']])
   *
   * @param (array) insertColumns - list of columns. also columns are mandatory
   * @param (array) insertValues - array of array with values
   * @param (object) insertOptions -
   * @param (object) [insertOptions.touch] - if true, auto insert created_at and updated_at values. Default is true.
   *
   * @return {object<self>} oThis
   */
  insertMultiple: function (insertColumnConst, insertValues, insertOptions) {
    const oThis = this
      , touchTimestampColumns = ((insertOptions || {}).touch===false ? false : true)
      , currentDate = new Date()
      , insertColumns = Object.assign([],insertColumnConst)
    ;

    if (![undefined, null, ''].includes(oThis.queryType)) {
      throw "Multiple type of query statements in single query builder object";
    }

    oThis.queryType = "INSERT";

    if (!Array.isArray(insertColumns) || insertColumns.length == 0) {
      throw "Unsupported INSERT columns data type";
    }

    if (!Array.isArray(insertValues)) {
      throw "Unsupported INSERT values data type";
    }

    // insert columns can be left empty
    oThis.insertIntoColumns = insertColumns;

    // Manage created_at and updated_at columns
    var createdAtDateTime = null
      , updatedAtDateTime = null
    ;
    if (touchTimestampColumns) {
      if (!oThis.insertIntoColumns.includes('updated_at')) {
        oThis.insertIntoColumns.push('updated_at');
        updatedAtDateTime = currentDate;
      }
      if (!oThis.insertIntoColumns.includes('created_at')) {
        oThis.insertIntoColumns.push('created_at');
        createdAtDateTime = currentDate;
      }
    }

    // insert values
    var totalColumnsToInsert = oThis.insertIntoColumns.length;
    for (var i = 0; i < insertValues.length; i++) {

      // Add timestamp column values
      if (updatedAtDateTime !== null) {
        insertValues[i].push(updatedAtDateTime);
      }
      if (createdAtDateTime !== null) {
        insertValues[i].push(createdAtDateTime);
      }

      if (totalColumnsToInsert != insertValues[i].length) {
        throw "Column length is not equal to value length";
      }
    }
    oThis.insertIntoColumnValues = insertValues;

    return oThis;
  },

  /**
   * Update columns to be applied to the query. If called multiple times, update fields will be joined by {,}.
   *
   * Possible data types:
   * * Array - index 0 should have the update sub query and other indexes should have the valued to be replaced in sub query
   * * Object - key and value pairs of columns and values to be joined by COMMA to form update sub query
   * * String - update sub query, used as it is.
   *
   * @param (*) updateFields - refer possible data types
   * @param (object) insertOptions -
   * @param (object) [insertOptions.touch] - if true, auto insert created_at and updated_at values. Default is true.
   *
   * Example 1: update in array format
   * update(['name=?, id=?', 'ACMA', 10])
   *
   * Example 2: Update in object format. Fields will be joined by {,}
   * update({name: 'ACMA', id: 10})
   *
   * Example 3: Update in string. Will be used as it is
   * update('id=10')
   *
   * @return {object<self>} oThis
   */
  update: function (updateFields, insertOptions) {
    const oThis = this
    ;

    // validations
    if (updateFields === undefined || updateFields === '') {
      throw "UPDATE fields can not be blank";
    }

    oThis.queryType = "UPDATE";

    if (typeof updateFields === 'string') {

      // simply push string to sub-queries array
      oThis.updateSubQueries.push(updateFields);

    } else if (Array.isArray(updateFields)) {

      // extract first element and push it to sub-queries array
      oThis.updateSubQueries.push(updateFields.shift());

      // remain array will be concatenated at the end of replacement array
      if (updateFields.length > 0) {
        oThis.updateSubQueriesReplacement = oThis.updateSubQueriesReplacement.concat(updateFields);
      }

    } else if (typeof updateFields === 'object') {

      // Extract keys and values in different arrays.
      // For sub-queries create string locally and push it to sub-queries array by joining with AND.
      // Also push key and value alternatively in local replacement array.
      var updateColumns = Object.keys(updateFields)
        , updateValues = Object.values(updateFields)
        , localSubQueries = []
        , localReplacements = [];


      if (updateColumns.length > 0) {
        for (var i = 0; i < updateColumns.length; i++) {
          localSubQueries.push("??=?");
          localReplacements.push(updateColumns[i]);
          localReplacements.push(updateValues[i]);
        }
        oThis.updateSubQueries.push(localSubQueries.join(', '));
        oThis.updateSubQueriesReplacement = oThis.updateSubQueriesReplacement.concat(localReplacements);
      } else {
        throw "Unsupported data type for UPDATE clause";
      }

    } else {
      throw "Unsupported data type for UPDATE clause";
    }

    // Manage updated_at column
    if (oThis.touchUpdatedAt !== false) {
      oThis.touchUpdatedAt = ((insertOptions || {}).touch===false ? false : true);
    }

    return oThis;
  },

  /**
   * Delete row from table
   *
   * Example 1:
   * delete()
   *
   * @return {object<self>} oThis
   */
  delete: function () {
    const oThis = this;

    if (![undefined, null, ''].includes(oThis.queryType)) {
      throw "Multiple type of query statements in single query builder object";
    }

    oThis.queryType = "DELETE";

    return oThis;
  },

  /**
   * Where conditions to be applied to the query. If called multiple times, where conditions will be joined by AND.
   *
   * Possible data types:
   * * Array - index 0 should have the where sub query and other indexes should have the valued to be replaced in sub query
   * * Object - key and value pairs of columns and values to be joined by AND to form where sub query
   * * String - where sub query, used as it is.
   *
   * Example 1: Where in array format
   * where(['name=? AND id=?', 'ACMA', 10])
   *
   * Example 2: Where in object format. Conditions will be joined by AND
   * where({name: 'ACMA', id: 10})
   * where({name: [1,2,3], id: 10})
   *
   * Example 3: condition in string. Will be used as it is
   * where('id=10')
   *
   * @return {object<self>} oThis
   */
  where: function (whereConditions) {
    const oThis = this
    ;

    // validations
    if (!['SELECT', 'UPDATE', 'DELETE'].includes(oThis.queryType)) {
      throw "Please select the query type before WHERE clause. Current query type: " + oThis.queryType;
    }
    if (whereConditions === undefined || whereConditions === '') {
      throw "WHERE condition can not be blank";
    }

    if (typeof whereConditions === 'string') {

      // simply push string to sub-queries array
      oThis.whereSubQueries.push(whereConditions);

    } else if (Array.isArray(whereConditions)) {

      // extract first element and push it to sub-queries array
      oThis.whereSubQueries.push(whereConditions.shift());

      // remain array will be concatenated at the end of replacement array
      if (whereConditions.length > 0) {
        oThis.whereSubQueriesReplacement = oThis.whereSubQueriesReplacement.concat(whereConditions);
      }

    } else if (typeof whereConditions === 'object') {

      // Extract keys and values in different arrays.
      // For sub-queries create string locally and push it to sub-queries array by joining with AND.
      // Also push key and value alternatively in local replacement array.
      var whereColumns = Object.keys(whereConditions)
        , whereValues = Object.values(whereConditions)
        , localSubQueries = []
        , localReplacements = [];


      if (whereColumns.length > 0) {
        for (var i = 0; i < whereColumns.length; i++) {
          if (Array.isArray(whereValues[i])) {
            localSubQueries.push("?? IN (?)");
          } else {
            localSubQueries.push("??=?");
          }
          localReplacements.push(whereColumns[i]);
          localReplacements.push(whereValues[i]);
        }
        oThis.whereSubQueries.push(localSubQueries.join(' AND '));
        oThis.whereSubQueriesReplacement = oThis.whereSubQueriesReplacement.concat(localReplacements);
      } else {
        throw "Unsupported data type for WHERE clause";
      }

    } else {
      throw "Unsupported data type for WHERE clause";
    }

    return oThis;
  },

  /**
   * List of fields to be grouped by from table. If called multiple times, group by conditions will be joined by COMMA.
   *
   * Possible data types:
   * * Array - list of field names will be joined by comma
   * * String - list of field names will be used as it is
   *
   * Example 1:
   * group_by(['name', 'created_at'])
   *
   * Example 2:
   * group_by('name, created_at')
   *
   * @return {object<self>} oThis
   */
  group_by: function (groupByConditions) {
    const oThis = this
    ;

    // validations
    if (!['SELECT'].includes(oThis.queryType)) {
      throw "Please select the query type before GROUP BY. Current query type: " + oThis.queryType;
    }
    if (groupByConditions === undefined || groupByConditions === '') {
      throw "GROUP BY condition can not be blank";
    }

    if (Array.isArray(groupByConditions)) {

      // list of columns to be group by on
      oThis.groupBySubQueries.push("??");
      oThis.groupBySubQueriesReplacement.push(groupByConditions);

    } else if (typeof groupByConditions === 'string') {

      // custom columns list will be fetched
      oThis.groupBySubQueries.push(groupByConditions);

    } else {
      throw "Unsupported data type for GROUP BY";
    }

    return oThis;
  },

  /**
   * List of fields to be ordered by from table. If called multiple times, order by conditions will be joined by COMMA.
   *
   * Possible data types:
   * * Object - where keys are column names and value is order
   * * String - order will be used as it is
   *
   * Example 1:
   * order_by({'name': 'ASC', 'created_at': 'DESC'})
   *
   * Example 2:
   * order_by('name ASC, created_at DESC')
   *
   * Example 3:
   * order_by([1, 2, 3])
   *
   * @return {object<self>} oThis
   */
  order_by: function (orderByConditions) {
    const oThis = this
    ;

    // validations
    if (!['SELECT', 'UPDATE', 'DELETE'].includes(oThis.queryType)) {
      throw "Please select the query type before ORDER BY. Current query type: " + oThis.queryType;
    }
    if (orderByConditions === undefined || orderByConditions === '') {
      throw "ORDER BY condition can not be blank";
    }

    if (Array.isArray(orderByConditions)) {

      // list of columns to be group by on
      oThis.orderBySubQueries.push("??");
      oThis.orderBySubQueriesReplacement.push(orderByConditions);

    } else if (typeof orderByConditions === 'object') {

      // Extract keys and values in different arrays.
      // For sub-queries create string locally and push it to sub-queries array by joining with COMMA.
      // Also push key and value alternatively in local replacement array.
      var orderColumns = Object.keys(orderByConditions)
        , orderValues = Object.values(orderByConditions)
        , localSubQueries = []
        , localReplacements = [];

      if (orderColumns.length > 0) {
        for (var i = 0; i < orderColumns.length; i++) {
          localSubQueries.push("?? " + (orderValues[i].toUpperCase() == "DESC" ? "DESC" : "ASC"));
          localReplacements.push(orderColumns[i]);
        }
        oThis.orderBySubQueries.push(localSubQueries.join(', '));
        oThis.orderBySubQueriesReplacement = oThis.orderBySubQueriesReplacement.concat(localReplacements);
      } else {
        throw "Unsupported data type for ORDER BY";
      }

    } else if (typeof orderByConditions === 'string') {

      // custom columns list will be fetched
      oThis.orderBySubQueries.push(orderByConditions);

    } else {
      throw "Unsupported data type for ORDER BY";
    }

    return oThis;
  },

  /**
   * List of fields for having clause. If called multiple times, having conditions will be joined by AND.
   *
   * Possible data types:
   * * Array - index 0 should have the having sub query and other indexes should have the valued to be replaced in sub query
   * * String - where sub query, used as it is.
   *
   * Example 1: Where in array format
   * having(['MIN(`salary`) < ?', 10])
   *
   * Example 2: condition in string. Will be used as it is
   * having('MIN(`salary`) < 10')
   *
   * @return {object<self>} oThis
   */
  having: function (havingConditions) {
    const oThis = this
    ;

    // validations
    if (!['SELECT'].includes(oThis.queryType)) {
      throw "Please select the query type before HAVING condition. Current query type: " + oThis.queryType;
    }
    if (havingConditions === undefined || havingConditions === '') {
      throw "HAVING condition can not be blank";
    }

    if (typeof havingConditions === 'string') {

      // simply push string to sub-queries array
      oThis.havingSubQueries.push(havingConditions);

    } else if (Array.isArray(havingConditions)) {

      // extract first element and push it to sub-queries array
      oThis.havingSubQueries.push(havingConditions.shift());

      // remaining array will be concatenated at the end of replacement array
      if (havingConditions.length > 0) {
        oThis.havingSubQueriesReplacement = oThis.havingSubQueriesReplacement.concat(havingConditions);
      }

    } else {
      throw "Unsupported data type for HAVING";
    }

    return oThis;
  },

  /**
   * Limit of records to be fetched. If called multiple times, it will overwrite the previous value
   *
   * Example 1:
   * limit(100)
   *
   * @param (number) recordsLimit - limit for select query
   *
   * @return {object<self>} oThis
   */
  limit: function (recordsLimit) {
    const oThis = this
    ;

    // Validations
    if (!['SELECT', 'UPDATE', 'DELETE'].includes(oThis.queryType)) {
      throw "Please select the query type before LIMIT. Current query type: " + oThis.queryType;
    }

    if (parseInt(recordsLimit) > 0) {

      // simply use the number in limit clause
      oThis.selectLimit = parseInt(recordsLimit);

    } else {
      throw "Unsupported data type for select LIMIT";
    }

    return oThis;
  },

  /**
   * Offset for records to be fetched. If called multiple times, it will overwrite the previous value. limit is mandatory for offset
   *
   * Example 1:
   * offset(10)
   *
   * @param (number) recordsOffset - offset for select query
   *
   * @return {object<self>} oThis
   */
  offset: function (recordsOffset) {
    const oThis = this
    ;

    // Validations
    if (!['SELECT'].includes(oThis.queryType)) {
      throw "Please select the query type before OFFSET. Current query type: " + oThis.queryType;
    }

    if (parseInt(recordsOffset) >= 0) {

      // simply use the number in limit clause
      oThis.selectOffset = parseInt(recordsOffset);

    } else {
      throw "Unsupported data type for select OFFSET";
    }

    return oThis;
  },

  /**
   * On Duplicate conditions to be applied to the INSERT query. If called multiple times, conditions will be joined by COMMA.
   *
   * Possible data types:
   * * Array - index 0 should have the On Duplicate sub query and other indexes should have the valued to be replaced in sub query
   * * Object - key and value pairs of columns and values to be joined by COMMA to form On Duplicate sub query
   * * String - sub query, used as it is.
   *
   * Example 1: ON DUPLICATE in array format
   * onDuplicate(['name=? , id=?', 'ACMA', 10])
   *
   * Example 2: ON DUPLICATE in object format. Conditions will be joined by ,
   * onDuplicate({name: 'ACMA', id: 10})
   *
   * Example 3: ON DUPLICATE in string. Will be used as it is
   * onDuplicate('id=10')
   *
   * @return {object<self>} oThis
   */
  onDuplicate: function (onDuplicateConditions) {
    const oThis = this
    ;

    // validations
    if (!['INSERT'].includes(oThis.queryType)) {
      throw "Please select the query type before ON DUPLICATE clause. Current query type: " + oThis.queryType;
    }
    if (onDuplicateConditions === undefined || onDuplicateConditions === '') {
      throw "ON DUPLICATE condition can not be blank";
    }

    if (typeof onDuplicateConditions === 'string') {

      // simply push string to sub-queries array
      oThis.onDuplicateSubQueries.push(onDuplicateConditions);

    } else if (Array.isArray(onDuplicateConditions)) {

      // extract first element and push it to sub-queries array
      oThis.onDuplicateSubQueries.push(onDuplicateConditions.shift());

      // remain array will be concatenated at the end of replacement array
      if (onDuplicateConditions.length > 0) {
        oThis.onDuplicateSubQueriesReplacement = oThis.onDuplicateSubQueriesReplacement.concat(onDuplicateConditions);
      }

    } else if (typeof onDuplicateConditions === 'object') {

      // Extract keys and values in different arrays.
      // For sub-queries create string locally and push it to sub-queries array by joining with COMMA.
      // Also push key and value alternatively in local replacement array.
      var onDuplicateColumns = Object.keys(onDuplicateConditions)
        , onDuplicateValues = Object.values(onDuplicateConditions)
        , localSubQueries = []
        , localReplacements = [];


      if (onDuplicateColumns.length > 0) {
        for (var i = 0; i < onDuplicateColumns.length; i++) {
          localSubQueries.push("??=?");
          localReplacements.push(onDuplicateColumns[i]);
          localReplacements.push(onDuplicateValues[i]);
        }
        oThis.onDuplicateSubQueries.push(localSubQueries.join(', '));
        oThis.onDuplicateSubQueriesReplacement = oThis.onDuplicateSubQueriesReplacement.concat(localReplacements);
      } else {
        throw "Unsupported data type for ON DUPLICATE clause";
      }

    } else {
      throw "Unsupported data type for ON DUPLICATE clause";
    }

    return oThis;
  },

  /**
   * Generate final query supported by mysql node module
   *
   * @return {object<response>}
   */
  generate: function () {
    const oThis = this
    ;

    if (oThis.queryType === "SELECT") {

      return oThis._generateSelect();

    } else if (oThis.queryType == "INSERT") {

      return oThis._generateInsert();

    } else if (oThis.queryType == "UPDATE") {

      return oThis._generateUpdate();

    } else if (oThis.queryType == "DELETE") {

      return oThis._generateDelete();

    } else {
      throw "Unsupported query type";
    }
  },

  /**
   * Generate the final SELECT statement
   *
   * @private
   */
  _generateSelect: function () {
    const oThis = this
    ;

    // Select query generation starts
    var queryString = oThis.queryType
      , queryData = [];

    // Select part of the query and it's data part
    if (oThis.selectSubQueries.length === 0) {
      // put * if no select mentioned ??
      throw "What do you want to select? Please mention.";
    }
    queryString += " " + oThis.selectSubQueries.join(', ');
    queryData = queryData.concat(oThis.selectSubQueriesReplacement);

    // If table name is present, generate the rest of the query and it's data
    if (oThis.tableName) {

      // from part of the query and it's data part
      queryString += " FROM ??";
      queryData.push(oThis.tableName);

      if (oThis.whereSubQueries.length > 0) {
        queryString += " WHERE (" + oThis.whereSubQueries.join(') AND (') + ")";
        queryData = queryData.concat(oThis.whereSubQueriesReplacement);
      }

      if (oThis.groupBySubQueries.length > 0) {
        queryString += " GROUP BY " + oThis.groupBySubQueries.join(', ');
        queryData = queryData.concat(oThis.groupBySubQueriesReplacement);
      }

      if (oThis.havingSubQueries.length > 0) {
        queryString += " HAVING (" + oThis.havingSubQueries.join(') AND (') + ")";
        queryData = queryData.concat(oThis.havingSubQueriesReplacement);
      }

      if (oThis.orderBySubQueries.length > 0) {
        queryString += " ORDER BY " + oThis.orderBySubQueries.join(', ');
        queryData = queryData.concat(oThis.orderBySubQueriesReplacement);
      }

      if (oThis.selectLimit > 0) {
        queryString += " LIMIT " + ((oThis.selectOffset > 0) ? oThis.selectOffset + ", " : "") + oThis.selectLimit;
      }

    }

    return responseHelper.successWithData({query: queryString, queryData: queryData});
  },

  /**
   * Generate the final INSERT statement
   *
   * @private
   */
  _generateInsert: function () {
    const oThis = this
    ;

    // Insert query generation starts
    var queryString = oThis.queryType
      , queryData = [];

    // insert columns should be present
    if (oThis.insertIntoColumns.length === 0) {
      throw "What do you want to insert? Please mention.";
    }

    if (!oThis.tableName) {
      throw "No Table Name given. Please mention.";
    }

    // from part of the query and it's data part
    queryString += " INTO ??";
    queryData.push(oThis.tableName);

    queryString += " (??)";
    queryData.push(oThis.insertIntoColumns);

    queryString += " VALUES ?";
    queryData.push(oThis.insertIntoColumnValues);

    if (oThis.onDuplicateSubQueries.length > 0) {
      queryString += " ON DUPLICATE KEY UPDATE " + oThis.onDuplicateSubQueries.join(', ');
      queryData = queryData.concat(oThis.onDuplicateSubQueriesReplacement);
    }

    return responseHelper.successWithData({query: queryString, queryData: queryData});
  },

  /**
   * Generate the final DELETE statement
   *
   * @private
   */
  _generateDelete: function () {
    const oThis = this
    ;

    // Delete query generation starts
    var queryString = oThis.queryType
      , queryData = []
      , queryWithoutWhere = true;

    if (!oThis.tableName) {
      throw "No Table Name given. Please mention.";
    }

    // from part of the query and it's data part
    queryString += " FROM ??";
    queryData.push(oThis.tableName);

    if (oThis.whereSubQueries.length > 0) {
      queryString += " WHERE (" + oThis.whereSubQueries.join(') AND (') + ")";
      queryData = queryData.concat(oThis.whereSubQueriesReplacement);
      queryWithoutWhere = false;
    }

    if (oThis.orderBySubQueries.length > 0) {
      queryString += " ORDER BY " + oThis.orderBySubQueries.join(', ');
      queryData = queryData.concat(oThis.orderBySubQueriesReplacement);
    }

    if (oThis.selectLimit > 0) {
      queryString += " LIMIT " + oThis.selectLimit;
    }

    // when where condition is not mentioned, query will be returned in a different key
    if (queryWithoutWhere) {
      return responseHelper.successWithData({dangerQuery: queryString, queryData: queryData});
    } else {
      return responseHelper.successWithData({query: queryString, queryData: queryData});
    }

  },

  /**
   * Generate the final UPDATE statement
   *
   * @private
   */
  _generateUpdate: function () {
    const oThis = this
    ;

    // Update query generation starts
    var queryString = oThis.queryType
      , queryData = [];

    if (!oThis.tableName) {
      throw "No Table Name given. Please mention.";
    }

    // from part of the query and it's data part
    queryString += " ??";
    queryData.push(oThis.tableName);

    if (oThis.updateSubQueries.length == 0) {
      throw "No update fields selected";
    }

    // Manage updated_at column
    if (oThis.touchUpdatedAt) {
      oThis.updateSubQueries.push('updated_at=?');
      oThis.updateSubQueriesReplacement = oThis.updateSubQueriesReplacement.concat([new Date()]);
    }

    queryString += " SET " + oThis.updateSubQueries.join(', ');
    queryData = queryData.concat(oThis.updateSubQueriesReplacement);

    if (oThis.whereSubQueries.length > 0) {
      queryString += " WHERE (" + oThis.whereSubQueries.join(') AND (') + ")";
      queryData = queryData.concat(oThis.whereSubQueriesReplacement);
    }

    if (oThis.orderBySubQueries.length > 0) {
      queryString += " ORDER BY " + oThis.orderBySubQueries.join(', ');
      queryData = queryData.concat(oThis.orderBySubQueriesReplacement);
    }

    if (oThis.selectLimit > 0) {
      queryString += " LIMIT " + oThis.selectLimit;
    }

    return responseHelper.successWithData({query: queryString, queryData: queryData});
  }

};

module.exports = MySQLQueryBuilderKlass;