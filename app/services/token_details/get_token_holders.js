"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , AddressIdMapCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap')
  , AddressDetailsModelKlass = require(rootPrefix + '/app/models/address_detail')
  , BrandedTokencCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , AddressHashCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addresses')
;


/**
 * Get details of token holders
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 contractAddress - contract address of branded token
 *                 page_payload - Object with hash
 *
 * @Constructor
 */
const GetTokenHoldersKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.contractAddress = params.contractAddress;
  oThis.pagePayload = params.page_payload;
  oThis.pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

};

GetTokenHoldersKlass.prototype = {

  /**
   * Perform operation of getting token holders details
   *
   * @return {Promise<void>}
   */
  perform: async function () {

    const oThis = this
      , checkUpdate = await oThis.updatePagePaylaodIfRequired()
      , contarctAddressDetails = await new AddressIdMapCacheKlass({chain_id: oThis.chainId, addresses: [oThis.contractAddress]}).fetch()
      , contarctAddressData = contarctAddressDetails.data
    ;

    console.log("contarctAddressData : ",contarctAddressData);
    if (contarctAddressDetails.isFailure() || !contarctAddressData[oThis.contractAddress]) {
      return Promise.resolve(responseHelper.error("s_td_gth_1", "contract address data not found for : ", oThis.contractAddress));
    }

    // get address token transfers
    const contractAddressId = contarctAddressData[oThis.contractAddress]['id']
      , addressDetailsObject = new AddressDetailsModelKlass(oThis.chainId)
      , offset = (oThis.pagePayload.page_no - 1) * (oThis.pageSize - 1)
      , finalTokenHoldersData = {}
    ;

    const addressDetailsData = await addressDetailsObject.select('id, address_id, contract_address_id, tokens')
      .where(['contract_address_id = ?',contractAddressId])
      .order_by('id desc')
      .offset(offset)
      .limit(oThis.pageSize)
      .fire()

    if (addressDetailsData.length === 0){
      return Promise.resolve(responseHelper.error("s_td_gth_2", "holder for contract address not found for : ", oThis.contractAddress));
    }

    finalTokenHoldersData['next_page_payload'] = oThis.getNextPagePaylaodForTokenHolders(addressDetailsData);
    finalTokenHoldersData['prev_page_payload'] = oThis.getPrevPagePaylaodForTokenHolders(addressDetailsData);

    // remove extra token transfer data
    if(addressDetailsData.length == oThis.pageSize){
      addressDetailsData.pop()
    }

    const addressIds = [];

    for (var i=0; i<addressDetailsData.length; i++){
      const address = addressDetailsData[i]
        , addressId = address.address_id
      ;
      addressIds.push(addressId);
    }


    const brandedTokenDetails = await new BrandedTokencCacheKlass({chain_id: oThis.chainId, contract_address_ids:[contractAddressId]}).fetch()
      , brandedTokenData = brandedTokenDetails.data
      , addressHashData = await new AddressHashCacheKlass({chain_id: oThis.chainId, ids:addressIds}).fetch()
    ;

    const formattedData = oThis.foramatHoldersData(addressDetailsData, addressHashData.data);

    const btDetails = {};
    btDetails[oThis.contractAddress] = brandedTokenData[contractAddressId];

    finalTokenHoldersData['contract_addresses'] = btDetails;
    finalTokenHoldersData['holders'] = formattedData;

    return Promise.resolve(responseHelper.successWithData(finalTokenHoldersData));
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

      var time = Math.floor(new Date() / 1000);

      var payload = {
        timestamp : time,
        page_no : 1
      };
      oThis.pagePayload = payload
    }
  }

  /**
   * format data of token holders
   *
   * @return {hash}
   */
  , foramatHoldersData: function (holders, addressHashes) {

    const formattedData = [];

    for (var i=0; i<holders.length;i++){
      const holder = holders[i]
        , addressData = addressHashes[holder.address_id]
      ;
      holder['address_hash'] = addressData.address_hash;

      formattedData.push(holder)
    }

    return formattedData;
  }
};

/**
 * get next page paylaod for pagination
 *
 * @return {hash}
 */
GetTokenHoldersKlass.prototype.getNextPagePaylaodForTokenHolders = function (requestResponse){

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
    timestamp: oThis.pagePayload.timestamp,
    direction: "next"
  };
};

/**
 * get previous page paylaod for pagination
 *
 * @return {hash}
 */
GetTokenHoldersKlass.prototype.getPrevPagePaylaodForTokenHolders = function (requestResponse){

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
    timestamp: oThis.pagePayload.timestamp,
    direction: "prev"
  };
}

module.exports = GetTokenHoldersKlass;