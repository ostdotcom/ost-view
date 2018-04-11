"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , TopTokensCacheKlass = require(rootPrefix + '/lib/cache_management/top_tokens')
  , BrandedTokensCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , BrandedTokenStatsCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_token_stats')
;

/**
 * Get details of top token
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 page_payload - Object with hash
 *
 * @Constructor
 */
const GetTopTokensKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.pagePayload = params.page_payload;

  oThis.pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

};

GetTopTokensKlass.prototype = {

  /**
   * Perform operation of getting top token details
   *
   * @return {Promise<void>}
   */
  perform: async function () {
    const oThis = this
      , finalFormattedData = {}
      , checkUpdate = await oThis.updatePagePaylaodIfRequired()
      , topTokensDetails = await  new TopTokensCacheKlass({chain_id : oThis.chainId }).fetch()
      , topTokensData = topTokensDetails.data
    ;

    if (topTokensDetails.isFailure() || !topTokensData['top_tokens']){
      return Promise.resolve(responseHelper.error("s_h_gtt_1", "getting issue in fetching top tokens"));
    }

   const topTokens = topTokensData.top_tokens
     , offset =  (oThis.pagePayload.page_no-1)*(oThis.pageSize-1)
     , lastIndex = offset+oThis.pageSize
   ;
   var contractAddresssIds = topTokens.slice(offset, lastIndex);

   finalFormattedData['next_page_payload'] = oThis.getNextPagePayloadForTopTokens(contractAddresssIds);
   finalFormattedData['prev_page_payload'] = oThis.getPrevPagePayloadForTopTokens(contractAddresssIds);

   if(contractAddresssIds.length == oThis.pageSize){
     contractAddresssIds.pop()
   }

   const brandedTokenDetails = await new BrandedTokensCacheKlass({chain_id:oThis.chainId, contract_address_ids:contractAddresssIds}).fetch()
     , brandedTokenData = brandedTokenDetails.data
     , brandedTokenStatsDetails = await new BrandedTokenStatsCacheKlass({chain_id:oThis.chainId, contract_address_ids:contractAddresssIds}).fetch()
     , brandedTokenStatsData = brandedTokenStatsDetails.data
   ;

    var rank = offset+1;
    const brandedTokenSequence = [];
    for(var i=0; i<contractAddresssIds.length; i++){

      const contractAddressId = contractAddresssIds[i]
        , btStats = brandedTokenStatsData[contractAddressId]
        , btDetails = brandedTokenData[contractAddressId]
        , topTokenData = btStats
      ;

      if (btDetails){
        topTokenData['rank'] = rank+i;
        topTokenData['company_name'] = btDetails['company_name'];
        topTokenData['company_symbol'] = btDetails['company_symbol'];
        topTokenData['conversion_rate'] = btDetails['conversion_rate'];
        topTokenData['symbol_icon'] = btDetails['symbol_icon'];

        brandedTokenSequence.push(topTokenData);
      }
    }

    finalFormattedData['top_tokens'] = brandedTokenSequence;
    finalFormattedData['contract_addresses'] = brandedTokenData

    return Promise.resolve(responseHelper.successWithData(finalFormattedData));

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

      var payload = {
        page_no : 1
      };
      oThis.pagePayload = payload
    }
  }

  /**
   * get next page paylaod for pagination
   *
   * @return {hash}
   */
  , getNextPagePayloadForTopTokens : function(requestResponse){
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
      direction: "next"
    };
  }

  /**
   * get previous page paylaod for pagination
   *
   * @return {hash}
   */
  , getPrevPagePayloadForTopTokens: function (response) {

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
      direction: "prev"
    };
  }
}

module.exports = GetTopTokensKlass;