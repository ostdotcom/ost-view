"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

const AddressDetailsKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

AddressDetailsKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const AddressDetailsSpecificPrototype = {

  tableName: coreConstants.ADDRESS_DETAILS_TABLE_NAME

};

Object.assign(AddressDetailsKlass.prototype, AddressDetailsSpecificPrototype);

module.exports = AddressDetailsKlass;


// ttk = require('./app/models/address_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
