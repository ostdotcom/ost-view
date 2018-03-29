"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

const TransactionKlass = function () {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

TransactionKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TransactionSpecificPrototype = {

  tableName: coreConstants.TRANSACTIONS_TABLE_NAME,

};

Object.assign(TransactionKlass.prototype, TransactionSpecificPrototype);

module.exports = TransactionKlass;