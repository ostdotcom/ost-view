"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;


const AggregatedKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

AggregatedKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const AggregatedPrototype = {

  tableName: coreConstants.AGGREGATED_TABLE_NAME,

};

Object.assign(AggregatedKlass.prototype, AggregatedPrototype);

AggregatedKlass.DATA_SEQUENCE_ARRAY = ['contract_address_id', 'branded_token_transaction_type_id', 'timestamp',
  'total_transactions', 'total_transaction_value', 'total_transfers', 'total_transfer_value', 'token_ost_volume'];

module.exports = AggregatedKlass;


// ttk = require('./app/models/token_transaction')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
