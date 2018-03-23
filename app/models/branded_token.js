"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const BrandedTokenKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

BrandedTokenKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BrandedTokenSpecificPrototype = {

  tableName: 'branded_token',
};

Object.assign(BrandedTokenKlass.prototype, BrandedTokenSpecificPrototype);

module.exports = BrandedTokenKlass;


// ttk = require('./app/models/branded_token')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
