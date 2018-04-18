"use strict";

const rootPrefix = "../../.."
  , TokenTransfersModelKlass = require(rootPrefix + '/app/models/token_transfer')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , TokenTransferKlass = require(rootPrefix + '/app/services/token_transfers/get_details')
  , BlockModelKlass = require(rootPrefix + '/app/models/block')
;

/**
 * Get details of recent token transfers
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 page_payload - Object with hash
 *
 * @Constructor
 */
const GetRecentTokenTransfersKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.pagePayload = params.page_payload;

  oThis.pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

};


GetRecentTokenTransfersKlass.prototype = {

  /**
   * Perform operation of getting recent token transfers details
   *
   * @return {Promise<void>}
   */
  perform: async function() {

    const oThis = this
      , checkUpdate = await oThis.updatePagePaylaodIfRequired()
      , tokenTransfersObject = new TokenTransfersModelKlass(oThis.chainId)
      , offset =  (oThis.pagePayload.page_no-1)*oThis.pageSize
    ;


    const recentTokenTransfers = await tokenTransfersObject.select('*')
      .where(['block_number <= ?',oThis.pagePayload.block_number])
      .order_by('id desc')
      .offset(offset)
      .limit(oThis.pageSize)
      .fire();

    if (recentTokenTransfers.length == 0){
      return Promise.resolve(responseHelper.error("s_h_grtt_1", "address data not found for home page"));
    }

    const tokenTransfers = {}
      , tokenTransferIds = []
    ;

    tokenTransfers['next_page_payload'] = oThis.getNextPagePayload(recentTokenTransfers);
    tokenTransfers['prev_page_payload'] = oThis.getPrevPagePayload(recentTokenTransfers);

    // remove extra token transfer data
    if(recentTokenTransfers.length == oThis.pageSize){
      recentTokenTransfers.pop()
    }

    for (var i=0; i< recentTokenTransfers.length; i++){
      const tokenTransfer = recentTokenTransfers [i];

      tokenTransferIds.push(tokenTransfer.id);
    }

    const tokenTransferData = await new TokenTransferKlass({chain_id: oThis.chainId, token_transfer_ids: tokenTransferIds}).perform()
    ;

    return Promise.resolve(responseHelper.successWithData(Object.assign(tokenTransfers,tokenTransferData.data)));
  }

  /**
   * get next page paylaod for pagination
   *
   * @return {hash}
   */
  , getNextPagePayload : function(requestResponse){
    const oThis = this
      , response = requestResponse
      , count = response.length
    ;

    if(count <= oThis.pageSize -1 ){
      return {};
    }

    var pageNumber = 0;
    if (oThis.pagePayload){
      if (!isNaN(parseInt(oThis.pagePayload.page_no))){
        pageNumber = parseInt(oThis.pagePayload.page_no) + 1
      }
    }else{
      pageNumber += 2;
    }

    return {
      page_no: pageNumber,
      block_number: oThis.pagePayload.block_number,
      direction: "next"
    };
  }

  /**
   * get previous page paylaod for pagination
   *
   * @return {hash}
   */
  , getPrevPagePayload: function (response) {

    const oThis = this
    ;

    var pageNumber = oThis.pagePayload.page_no;


    // If page payload is null means its a request for 1st page
    // OR direction is previous and pageNumber if less than or equal to 1 means there is no previous page
    if(!oThis.pagePayload || (oThis.pagePayload.direction === 'prev' && pageNumber <= 1)){
      return {};
    }

    if (oThis.pagePayload){
      if (!isNaN(parseInt(oThis.pagePayload.page_no))){
        pageNumber = parseInt(oThis.pagePayload.page_no) - 1
      }
    }else{
      pageNumber += 1;
    }

    return {
      page_no: pageNumber,
      block_number: oThis.pagePayload.block_number,
      direction: "prev"
    };
  }

  /**
   * for first page data set default page payload
   *
   * @return {hash}
   */
  , updatePagePaylaodIfRequired:  async function () {

    const oThis = this
    ;

    if (!oThis.pagePayload || oThis.pagePayload === undefined){

      const blockObject = new BlockModelKlass(oThis.chainId)
      ;

      const blockMaxCount = await blockObject.select('Count(id)').fire();

      var payload = {
        block_number : blockMaxCount[0]['Count(id)'],
        page_no : 1
      };
      oThis.pagePayload = payload
    }
  }
};


module.exports = GetRecentTokenTransfersKlass;