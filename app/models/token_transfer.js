"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;


const TokenTransferKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

TokenTransferKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const TokenTransferSpecificPrototype = {

  tableName: coreConstants.TOKEN_TRANSFERS_TABLE_NAME,

};

Object.assign(TokenTransferKlass.prototype, TokenTransferSpecificPrototype);

TokenTransferKlass.DATA_SEQUENCE_ARRAY = ['transaction_hash_id', 'block_number', 'contract_address_id', 'from_address_id', 'to_address_id', 'tokens', 'block_timestamp'];
module.exports = TokenTransferKlass;


// ttk = require('./app/models/token_transaction')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
