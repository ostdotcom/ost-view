"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const BrandedTokensKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

BrandedTokensKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BrandedTokensSpecificPrototype = {

  tableName: coreConstants.BRANDED_TOKENS_TABLE_NAME,
};

Object.assign(BrandedTokensKlass.prototype, BrandedTokensSpecificPrototype);

module.exports = BrandedTokensKlass;


// ttk = require('./app/models/branded_token')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
