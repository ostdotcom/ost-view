"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

/**
 * constructor
 *
 * @param {Object} chainId - chain id
 *
 * @constructor
 */
const TransactionHashKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

TransactionHashKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TransactionHashPrototype = {

  tableName: coreConstants.TRANSACTIONS_HASHES_TABLE_NAME

};

Object.assign(TransactionHashKlass.prototype, TransactionHashPrototype);

TransactionHashKlass.DATA_SEQUENCE_ARRAY = ['transaction_hash'];

module.exports = TransactionHashKlass;


// ttk = require('./app/models/address_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
