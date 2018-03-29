"use strict";

const rootPrefix = "../../.."
  , BlockCacheKlass = require(rootPrefix + '/lib/cache_management/block')
  , BlockTokenTransfersCacheKlass = require(rootPrefix + '/lib/cache_management/block_token_transfers')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  ;

/**
 * Get Details of a block
 *
 * @param {object} params - this is object with keys.
 *                 blockNumber - Block number to fetch data for.
 *                 chainId - Chain Id.
 *
 * @Constructor
 */
const GetBlockDetailsKlass = function(params){
  const oThis = this;

  oThis.blockNumber = params.blockNumber;
  oThis.chainId = params.chainId;
};

GetBlockDetailsKlass.prototype = {

  /**
   * Perform operation of getting block details
   *
   * @return {Promise<void>}
   */
  perform: async function(){
    const oThis = this
      , blockData = await new BlockCacheKlass({chain_id: oThis.chainId, block_number: oThis.blockNumber}).fetch()
      ;

    if(blockData.isFailure()){
      return Promise.resolve(responseHelper.error("s_b_gd_1", "Block Data not found"));
    }

    var blockDetails = blockData.data;
    blockDetails['total_token_transfers'] = 0;

    const tokenTransfers = await new BlockTokenTransfersCacheKlass({chain_id: oThis.chainId, block_number: oThis.blockNumber}).fetch();

    if(tokenTransfers.isSuccess()){
      blockDetails['total_token_transfers'] = tokenTransfers.data[oThis.blockNumber].length;
    }

    return Promise.resolve(responseHelper.successWithData(blockDetails));
  }
};

module.exports = GetBlockDetailsKlass;