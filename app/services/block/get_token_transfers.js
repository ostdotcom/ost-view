"use strict";

const rootPrefix = "../../.."
  , BlockTokenTransfersCacheKlass = require(rootPrefix + '/lib/cache_management/block_token_transfers')
  , TokenTransferDetailsKlass = require(rootPrefix + '/app/services/token_transfers/get_details')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  ;

const GetBlockTokenTransfersKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.blockNumber = params.blockNumber;
};

GetBlockTokenTransfersKlass.prototype = {

  perform: async function(){
    const oThis = this
      , tokenTransfers = await new BlockTokenTransfersCacheKlass({chain_id: oThis.chainId, block_number: oThis.blockNumber}).fetch()
    ;

    if(tokenTransfers.isFailure() || tokenTransfers.data[oThis.blockNumber].length <= 0){
      return Promise.resolve(responseHelper.error("s_b_gtt_1", "Token transfers not found for a block."));
    }

    const tokenTransfersData = await new TokenTransferDetailsKlass({chain_id: oThis.chainId,
      token_transfer_ids: tokenTransfers.data[oThis.blockNumber]}).perform();

    if(tokenTransfersData.isFailure()){
      return Promise.resolve(tokenTransfersData);
    }

    return Promise.resolve(responseHelper.successWithData(tokenTransfersData.data));
  }
};

module.exports = GetBlockTokenTransfersKlass;