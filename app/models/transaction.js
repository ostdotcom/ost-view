"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , transactionConst = require(rootPrefix + '/lib/global_constant/transaction')
  , util = require(rootPrefix + '/lib/util')
;

const transactionStatus = {
  '1': transactionConst.failed,
  '2': transactionConst.succeeded,

}
  , invertedTransactionStatus = util.invert(transactionStatus);


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

  transactionStatus: transactionStatus,

  invertedTransactionStatus: invertedTransactionStatus,

  enums: {
    'transaction_status': {
      val: transactionStatus,
      inverted: invertedTransactionStatus
    }
  }

};

Object.assign(TransactionKlass.prototype, TransactionSpecificPrototype);

TransactionKlass.DATA_SEQUENCE_ARRAY = ['transaction_hash_id', 'block_number', 'transaction_index', 'contract_address_id', 'from_address_id', 'to_address_id', 'tokens', 'gas_used', 'gas_price', 'nounce','block_timestamp', 'status'];

module.exports = TransactionKlass;