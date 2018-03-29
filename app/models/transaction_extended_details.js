"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const TransactionExtendedDetailsKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

TransactionExtendedDetailsKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TransactionExtendedDetailsPrototype = {

  tableName: coreConstants.TRANSACTION_EXTENDED_DETAILS_TABLE_NAME

};

Object.assign(TransactionExtendedDetailsKlass.prototype, TransactionExtendedDetailsPrototype);

module.exports = TransactionExtendedDetailsKlass;


// ttk = require('./app/models/address_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
