"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const TransactionsKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

TransactionsKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TransactionsSpecificPrototype = {

  tableName: coreConstants.TRANSACTIONS_TABLE_NAME,

};

Object.assign(TransactionsKlass.prototype, TransactionsSpecificPrototype);

module.exports = TransactionsKlass;