"use strict";

const rootPrefix = '../..'
  , util = require(rootPrefix + '/lib/util')
  , MysqlQueryKlass = require(rootPrefix + '/lib/query_builders/mysql')
  , mysqlWrapper = require(rootPrefix + "/lib/mysql_wrapper")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , config = require(rootPrefix + '/config')
;

const ModelBaseKlass = function (params) {
  var oThis = this;

  oThis.chainId = params.chainId;
  oThis.dbConfig = config.getMysqlDbConfig(params.chainId);

  if (!oThis.dbConfig) {
    logger.error("app/models/base :: ModelBaseKlass :: dbConfig cannot be ", oThis.dbConfig);
    process.exit(1);
  }

  MysqlQueryKlass.call(this);
};

ModelBaseKlass.prototype = Object.create(MysqlQueryKlass.prototype);

const ModelBaseKlassPrototype = {

  // get read connection
  onReadConnection: function() {
    return mysqlWrapper.getPoolFor(this.dbConfig, 'master');
  },

  // get read connection
  onWriteConnection: function() {
    return mysqlWrapper.getPoolFor(this.dbConfig, 'master');
  },

  convertEnumForDB: function (params, readable) {
    var oThis = this
      , enumKeys = Object.keys(oThis.enums);

    for (var i = 0; i < enumKeys.length; i++) {
      var enum_k = enumKeys[i];

      if (params[enum_k]) {
        params[enum_k] = readable ? oThis.enums[enum_k]['val'][params[enum_k]] : oThis.enums[enum_k]['inverted'][params[enum_k]];
      }
    }
    return params;
  },

  convertEnumForResult: function (params) {
    return this.convertEnumForDB(params, true);
  },

  fire: function () {
    var oThis = this;

    return new Promise(
      function (onResolve, onReject) {

        const queryGenerator = oThis.generate();
        if(queryGenerator.isSuccess()){
          //logger.log(queryGenerator.data.query, queryGenerator.data.queryData);
        }

        var pre_query = Date.now();
        var qry = oThis.onWriteConnection().query(queryGenerator.data.query, queryGenerator.data.queryData, function (err, result, fields) {
          //logger.info("("+(Date.now() - pre_query)+" ms)", qry.sql);
          if (err) {
            onReject(err);
          } else {
            onResolve(result);
          }
        });
      }
    );

  },

  create: function (params) {

    var oThis = this
      , createFields = []
      , setFieldsValues = []
    ;

    params = oThis.convertEnumForDB(params);

    for (var key in params) {
      if(key=='id' || key=='updated_at' || key=='created_at') continue;
      createFields.push(key);
      setFieldsValues.push(params[key])
    }

    return oThis.QueryDB.insert(
      oThis.tableName,
      createFields,
      setFieldsValues
    );

  },

  bulkInsert: function (createFields, setFieldsValues) {

    var oThis = this
      , addingCreatedAt = false
      , addingUpdatedAt = false
      , currentDateTime = util.formatDbDate(new Date())
    ;

    if(createFields.indexOf('created_at') < 0){
      createFields.push('created_at');
      addingCreatedAt = true;
    }
    if(createFields.indexOf('updated_at') < 0){
      createFields.push('updated_at');
      addingUpdatedAt = true;
    }

    for (var i in setFieldsValues) {
      if(addingCreatedAt) setFieldsValues[i].push(currentDateTime);
      if(addingUpdatedAt) setFieldsValues[i].push(currentDateTime)
    }

    return oThis.QueryDB.bulkInsert(
      oThis.tableName,
      createFields,
      setFieldsValues
    );

  },

  edit: function (params) {
    var oThis = this
      , editFields = []
      , setFieldsValues = []
      , whereCondFields = []
      , whereCondFieldsValues = []
    ;

    params['qParams'] = oThis.convertEnumForDB(params['qParams']);
    for (var key in params['qParams']) {
      if(key=='id' || key=='updated_at' || key=='created_at') continue;
      editFields.push(key + '=?');
      setFieldsValues.push(params['qParams'][key])
    }

    for (var key in params['whereCondition']) {
      if (Array.isArray(params['whereCondition'][key])) {
        whereCondFields.push(key + ' IN ?');
      } else {
        whereCondFields.push(key + '=?');
      }
      whereCondFieldsValues.push(params['whereCondition'][key]);
    }

    return oThis.QueryDB.edit(
      oThis.tableName,
      editFields,
      setFieldsValues,
      whereCondFields,
      whereCondFieldsValues
    );
  }

};

Object.assign(ModelBaseKlass.prototype, ModelBaseKlassPrototype);

module.exports = ModelBaseKlass;