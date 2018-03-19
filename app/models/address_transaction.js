"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const AddressTransactionKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

AddressTransactionKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const AddressTransactionSpecificPrototype = {

  tableName: 'address_transactions'

};

Object.assign(AddressTransactionKlass.prototype, AddressTransactionSpecificPrototype);

module.exports = AddressTransactionKlass;


// ttk = require('./app/models/address_transaction')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
