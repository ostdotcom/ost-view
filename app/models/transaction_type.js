"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const TransactionTypeKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

TransactionTypeKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TransactionTypeSpecificPrototype = {

  tableName: 'transaction_type',

};

Object.assign(TransactionTypeKlass.prototype, TransactionTypeSpecificPrototype);

module.exports = TransactionTypeKlass;