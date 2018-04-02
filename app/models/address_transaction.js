"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;


const AddressTransactionKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

AddressTransactionKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const AddressTransactionSpecificPrototype = {

  tableName: coreConstants.ADDRESS_TRANSACTIONS_TABLE_NAME

};

Object.assign(AddressTransactionKlass.prototype, AddressTransactionSpecificPrototype);

AddressTransactionKlass.DATA_SEQUENCE_ARRAY = ['address_id', 'corresponding_address_id', 'transaction_hash_id', 'tokens', 'transaction_fees', 'inflow', 'tx_timestamp'];

module.exports = AddressTransactionKlass;


// ttk = require('./app/models/address_transaction')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
