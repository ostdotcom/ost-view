"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

const TransactionsKlass = function () {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
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