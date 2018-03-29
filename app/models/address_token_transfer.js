"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const AddressTokenTransfersKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

AddressTokenTransfersKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const AddressTokenTransfersSpecificPrototype = {

  tableName: coreConstants.ADDRESS_TOKEN_TRANSFERS_TABLE_NAME

};

Object.assign(AddressTokenTransfersKlass.prototype, AddressTokenTransfersSpecificPrototype);

module.exports = AddressTokenTransfersKlass;


// ttk = require('./app/models/address_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
