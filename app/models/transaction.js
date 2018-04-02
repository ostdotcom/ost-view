"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

const TransactionKlass = function (chainId) {
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

TransactionKlass.DATA_SEQUENCE_ARRAY = ['transaction_hash_id', 'block_number', 'transaction_index', 'contract_address_id', 'from_address_id', 'to_address_id', 'tokens', 'gas_used', 'gas_price', 'nounce','block_timestamp', 'status'];

module.exports = TransactionKlass;