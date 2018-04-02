"use strict";

/**
 * Get Details of Token transfers for given token transfer ids
 *
 * @module app/services/token_transfers/get_details
 *
 */
const rootPrefix = "../../.."
  , TokenTransfersCacheKlass = require(rootPrefix + '/lib/cache_multi_management/token_transfers')
  , BrandedTokensCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * Get Complete Details of Token transfers for given token transfer ids
 *
 * @param {object} params - this is object with keys.
 *                 token_transfer_ids - Token transfer ids to fetch data for.
 *                 chain_id - Chain Id.
 * @constructor
 */
const GetTokenTransferDetailsKlass = function(params){
  const oThis = this;

  oThis.transferIds = params.token_transfer_ids;
  oThis.chainId = params.chain_id;
};

GetTokenTransferDetailsKlass.prototype = {

  /**
   * Fetch details for token transfers
   *
   * @return {Promise<any>}
   */
  perform: async function(){
    const oThis = this;

    const tokenTransfersData = await new TokenTransfersCacheKlass({chain_id: oThis.chainId, ids: oThis.transferIds}).fetch();

    if(tokenTransfersData.isFailure() || !tokenTransfersData.data){
      return Promise.resolve(responseHelper.error("s_tt_gd_1", "Token transfer ids are invalid."));
    }

    const tokenTransfersHash = tokenTransfersData.data;

    var tokenTransfers = []
      , contractIds = []
      , contract_addresses = {};

    /**
     * Collect contract ids to fetch data for
     */
    for(var key in tokenTransfersHash){
      const tth = tokenTransfersHash[key];
      contractIds.push(tth.contract_id);
    }

    /**
     * Fetch contract data
     */
    const brandedTokensData = await new BrandedTokensCacheKlass({chain_id: oThis.chainId, contract_address_ids: contractIds}).fetch();

    if(brandedTokensData.isFailure() || !brandedTokensData.data){
      return Promise.resolve(responseHelper.error("s_tt_gd_2", "Branded Tokens Data not found"));
    }

    const brandedTokensHash = brandedTokensData.data;


    for(var key in tokenTransfersHash){
      const tth = tokenTransfersHash[key];
      tokenTransfers.push(tth);
      if(!contract_addresses[tth.contract_address]){
        contract_addresses[tth.contract_address] = brandedTokensHash[tth.contract_id];
      }
    }

    return Promise.resolve(responseHelper.successWithData({token_transfers: tokenTransfers, contract_addresses: contract_addresses}));
  }
};

module.exports = GetTokenTransferDetailsKlass;