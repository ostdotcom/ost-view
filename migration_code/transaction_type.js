"use strict";

const rootPrefix = '..'
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;
/**
 * constructor
 *
 * @param {Object} chainId - chain id
 *
 * @constructor
 */
const TransactionTypeKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

TransactionTypeKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TransactionTypeSpecificPrototype = {

  tableName: 'transaction_type'

};

Object.assign(TransactionTypeKlass.prototype, TransactionTypeSpecificPrototype);

module.exports = TransactionTypeKlass;


// ttk = require('./migration_code/transaction_type.js')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
