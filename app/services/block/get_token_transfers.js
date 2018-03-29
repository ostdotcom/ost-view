"use strict";

const rootPrefix = "../../.."
  , BlockTokenTransfersCacheKlass = require(rootPrefix + '/lib/cache_management/block_token_transfers')
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
      return Promise.resolve(responseHelper.error("s_b_gtt_1", "Data not found"));
    }


  }
};

module.exports = GetBlockTokenTransfersKlass;