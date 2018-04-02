"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;


const BrandedTokenKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

BrandedTokenKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BrandedTokenSpecificPrototype = {

  tableName: coreConstants.BRANDED_TOKENS_TABLE_NAME,
};

Object.assign(BrandedTokenKlass.prototype, BrandedTokenSpecificPrototype);

BrandedTokenKlass.DATA_SEQUENCE_ARRAY = ['name', 'contract_address_id', 'symbol', 'uuid', 'conversion_rate', 'symbol_icon', 'creation_timestamp'];

module.exports = BrandedTokenKlass;


// ttk = require('./app/models/branded_token')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
