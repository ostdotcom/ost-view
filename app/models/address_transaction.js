"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const AddressTransactionsKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

AddressTransactionsKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const AddressTransactionsSpecificPrototype = {

  tableName: coreConstants.ADDRESS_TRANSACTIONS_TABLE_NAME

};

Object.assign(AddressTransactionsKlass.prototype, AddressTransactionsSpecificPrototype);

module.exports = AddressTransactionsKlass;


// ttk = require('./app/models/address_transaction')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
