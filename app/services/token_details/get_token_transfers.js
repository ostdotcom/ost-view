"use strict";

const rootPrefix = "../../.."
  , TokenTransfersModelKlass = require(rootPrefix + '/app/models/token_transfer')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , TokenTransferKlass = require(rootPrefix + '/app/services/token_transfers/get_details')
  , AddressIdMapCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap')
;

/**
 * Get details of token transfers for a given branded token
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 contractAddress - contract address of branded token
 *                 page_payload - Object with hash
 *
 * @Constructor
 */
const GetTokenTransfersKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.contractAddress = params.contractAddress;
  oThis.pagePayload = params.page_payload;
  oThis.pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

};

GetTokenTransfersKlass.prototype = {

  /**
   * Perform operation of getting token transfer details
   *
   * @return {Promise<void>}
   */
  perform: async function () {

    //get address details
    const oThis = this
      , checkUpdate = await oThis.updatePagePaylaodIfRequired()
      , contarctAddressDetails = await new AddressIdMapCacheKlass({chain_id: oThis.chainId, addresses: [oThis.contractAddress]}).fetch()
      , contarctAddressData = contarctAddressDetails.data
    ;

    if (contarctAddressDetails.isFailure() || !contarctAddressData[oThis.contractAddress]) {
      return Promise.resolve(responseHelper.error("s_td_gth_1", "contract address data not found for : ", oThis.contractAddress));
    }

    // get address token transfers
    const contractAddressId = contarctAddressData[oThis.contractAddress]['id']
      , tokenTransfersObject = new TokenTransfersModelKlass(oThis.chainId)
      , offset = (oThis.pagePayload.page_no - 1) * (oThis.pageSize - 1)
      , timestamp = oThis.pagePayload.timestamp
    ;

    const tokenTransfersData = await tokenTransfersObject.select('id')
      .where(['contract_address_id = ? and block_timestamp <= ? ', contractAddressId, timestamp])
      .order_by('block_timestamp desc, id desc')
      .offset(offset)
      .limit(oThis.pageSize)
      .fire();

    if (tokenTransfersData.length === 0) {
      return Promise.resolve(responseHelper.error("s_a_gtt_2", "address token transfers not found for : ", oThis.address));
    }

    const tokenTransferIds = []
      , finalTokenTransferData = {}
    ;

    finalTokenTransferData['next_page_payload'] = oThis.getNextPagePaylaodForTokenTransfers(tokenTransfersData);
    finalTokenTransferData['prev_page_payload'] = oThis.getPrevPagePaylaodForTokenTransfers(tokenTransfersData);

    // remove extra token transfer data
    if(tokenTransfersData.length == oThis.pageSize){
      tokenTransfersData.pop()
    }

    for (var i = 0; i< tokenTransfersData.length; i++){

      tokenTransferIds.push(tokenTransfersData[i]['id'])
    }

    const tokenTransferData = await new TokenTransferKlass({chain_id: oThis.chainId, token_transfer_ids: tokenTransferIds}).perform()
      , tokenTransferDetails  = tokenTransferData.data
    ;

    finalTokenTransferData['token_transfers'] = tokenTransferDetails.token_transfers;
    finalTokenTransferData['contract_addresses'] = tokenTransferDetails.contract_addresses;

    return Promise.resolve(responseHelper.successWithData(finalTokenTransferData));

  }

  , updatePagePaylaodIfRequired:  async function () {

    const oThis = this
    ;


    if (!oThis.pagePayload || oThis.pagePayload === undefined){

      var time = Math.floor(new Date() / 1000);

      var payload = {
        timestamp :time,
        page_no : 1
      };
      oThis.pagePayload = payload
    }
  }
}

GetTokenTransfersKlass.prototype.getNextPagePaylaodForTokenTransfers = function (requestResponse){

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
}

GetTokenTransfersKlass.prototype.getPrevPagePaylaodForTokenTransfers = function (requestResponse){

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

module.exports = GetTokenTransfersKlass;