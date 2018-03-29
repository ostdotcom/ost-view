"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const tokenTransfersKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

tokenTransfersKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TokenTransfersSpecificPrototype = {

  tableName: coreConstants.TOKEN_TRANSFERS_TABLE_NAME,

};

Object.assign(tokenTransfersKlass.prototype, TokenTransfersSpecificPrototype);

module.exports = tokenTransfersKlass;


// ttk = require('./app/models/token_transaction')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
