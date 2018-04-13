"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;
/**
 * constructor
 *
 * @param {Object} chainId - chain id
 *
 * @constructor
 */
const BrandedTokenTransactionTypesKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

BrandedTokenTransactionTypesKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BrandedTokenTransactionTypesSpecificPrototype = {

  tableName: coreConstants.BRANDED_TOKEN_TRANSACTION_TYPES_TABLE_NAME

};

Object.assign(BrandedTokenTransactionTypesKlass.prototype, BrandedTokenTransactionTypesSpecificPrototype);

BrandedTokenTransactionTypesKlass.DATA_SEQUENCE_ARRAY = ['contract_address_id', 'transaction_type'];

module.exports = BrandedTokenTransactionTypesKlass;


// ttk = require('./app/models/address_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
