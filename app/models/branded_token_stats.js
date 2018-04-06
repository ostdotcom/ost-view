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
const BrandedTokenStatsKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

BrandedTokenStatsKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BrandedTokenStatsPrototype = {

  tableName: coreConstants.BRANDED_TOKENS_STATS_TABLE_NAME,
};

Object.assign(BrandedTokenStatsKlass.prototype, BrandedTokenStatsPrototype);

BrandedTokenStatsKlass.DATA_SEQUENCE_ARRAY = ['contract_address_id', 'token_holders', 'token_transfers', 'total_supply', 'token_ost_volume', 'market_cap', 'circulation'];

module.exports = BrandedTokenStatsKlass;


// ttk = require('./app/models/branded_token_stats')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
