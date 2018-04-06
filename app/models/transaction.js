"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , transactionConst = require(rootPrefix + '/lib/global_constant/transaction')
  , util = require(rootPrefix + '/lib/util')
;

const statuses = {
  '1': transactionConst.failed,
  '2': transactionConst.succeeded,

}
  , invertedStatuses = util.invert(statuses);

/**
 * constructor
 *
 * @param {Object} chainId - chain id
 *
 * @constructor
 */
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

  statuses: statuses,

  invertedStatuses: invertedStatuses,

  enums: {
    'status': {
      val: statuses,
      inverted: invertedStatuses
    }
  }

};

Object.assign(TransactionKlass.prototype, TransactionSpecificPrototype);

TransactionKlass.DATA_SEQUENCE_ARRAY = ['transaction_hash_id', 'block_number', 'transaction_index', 'contract_address_id', 'from_address_id', 'to_address_id', 'tokens', 'gas_used', 'gas_price', 'nounce','block_timestamp', 'status'];

module.exports = TransactionKlass;