"use strict";

/**
 * Get Details of Token transfers for given block number
 *
 * @module app/services/block/get_token_transfers
 *
 */
const rootPrefix = "../../.."
  , BlockTokenTransfersCacheKlass = require(rootPrefix + '/lib/cache_management/block_token_transfers')
  , TokenTransferDetailsKlass = require(rootPrefix + '/app/services/token_transfers/get_details')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  ;


/**
 * Get Complete Details of Token transfers for given block number
 *
 * @param {object} params - this is object with keys.
 *                 blockNumber - Block Number to fetch token transfers for.
 *                 chain_id - Chain Id.
 *                 page_payload - Next page or previous page payload
 * @constructor
 */
const GetBlockTokenTransfersKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.blockNumber = params.blockNumber;
  oThis.pagePayload = params.page_payload;
};

GetBlockTokenTransfersKlass.prototype = {

  /**
   * Perform operation to fetch token transfers for a given block
   *
   * @return {Promise<any>}
   */
  perform: async function(){
    const oThis = this
      , tokenTransfers = await new BlockTokenTransfersCacheKlass({chain_id: oThis.chainId, block_number: oThis.blockNumber}).fetch()
    ;

    if(tokenTransfers.isFailure() || tokenTransfers.data[oThis.blockNumber].length <= 0){
      return Promise.resolve(responseHelper.error("s_b_gtt_1", "Token transfers not found for a block."));
    }


    if(!oThis.pagePayload || !oThis.pagePayload.token_transfer_index){
      oThis.pagePayload = {token_transfer_index: 0};
    }

    // Transfer ids would be taken from transaction index till page size.
    const lastIndex = oThis.pagePayload.token_transfer_index + coreConstant.DEFAULT_PAGE_SIZE
      , tokenTransferIds = tokenTransfers.data[oThis.blockNumber].slice(oThis.pagePayload.token_transfer_index, lastIndex);

    const tokenTransfersData = await new TokenTransferDetailsKlass({chain_id: oThis.chainId,
      token_transfer_ids: tokenTransferIds}).perform();

    if(tokenTransfersData.isFailure()){
      return Promise.resolve(tokenTransfersData);
    }

    var page_payloads = {prev_page_payload: {}, next_page_payload: {}};
    // If from current index page size is subtracted and is not negative then previous page payload is present.
    if((oThis.pagePayload.token_transfer_index - coreConstant.DEFAULT_PAGE_SIZE) > 0) {
      page_payloads['prev_page_payload'] = {dir: 'prev', token_transfer_index: (oThis.pagePayload.token_transfer_index - coreConstant.DEFAULT_PAGE_SIZE)};
    }
    //If data is present for last index in this loop means next page is present.
    if(tokenTransfers.data[oThis.blockNumber][lastIndex]){
      page_payloads['next_page_payload'] = {token_transfer_index: lastIndex, dir: 'next'}
    }

    // Merge tokens transfer data with page payloads for next page.
    return Promise.resolve(responseHelper.successWithData(Object.assign(tokenTransfersData.data, page_payloads)));
  }
};

module.exports = GetBlockTokenTransfersKlass;