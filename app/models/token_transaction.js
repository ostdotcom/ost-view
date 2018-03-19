"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const TokenTransactionKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

TokenTransactionKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TokenTransactionSpecificPrototype = {

  tableName: 'token_transactions',

};

Object.assign(TokenTransactionKlass.prototype, TokenTransactionSpecificPrototype);

module.exports = TokenTransactionKlass;


// ttk = require('./app/models/token_transaction')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
