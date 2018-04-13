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
const TransactionTypeIdKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

TransactionTypeIdKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TransactionTypeIdSpecificPrototype = {

  tableName: 'transaction_type_id'

};

Object.assign(TransactionTypeIdKlass.prototype, TransactionTypeIdSpecificPrototype);

module.exports = TransactionTypeIdKlass;


// ttk = require('./migration_code/transaction_type_id.js')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
