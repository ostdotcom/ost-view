"use strict";

const rootPrefix = "../../.."
  , AddressTokenTransfersModelKlass = require(rootPrefix + '/app/models/address_token_transfer')
  , AddressDetailsCacheKlass = require(rootPrefix + '/lib/cache_multi_management/address_details')
  , BrandedTokenCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_tokens')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , AddressesCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addresses')
  , TransactionHashCacheKlass = require(rootPrefix + '/lib/cache_multi_management/transaction_hashes')
  , AddressIdMapCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap')
;

/**
 * Get token transfers of an address
 *
 * @param {object} params - this is object with keys.
 *                 address - address to fetch data for.
 *                 chainId - Chain Id.
 *                 page_payload - Object with hash
 *
 * @Constructor
 */
const GetAddressTokenTransfersKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.address = params.address.toLowerCase();
  oThis.pagePayload = params.page_payload;
  oThis.pageSize = coreConstant.DEFAULT_PAGE_SIZE+1;

};

GetAddressTokenTransfersKlass.prototype = {

  /**
   * Perform operation of getting token transfers of an address
   *
   * @return {Promise<void>}
   */
  perform: async function(){

    //get address details
    const oThis = this
      , finalTokenTransferData = {}
      , checkUpdate = await oThis.updatePagePaylaodIfRequired()
      , addressDetails = await  new AddressIdMapCacheKlass({chain_id: oThis.chainId, addresses: [oThis.address]}).fetch()
      , addressDetailsData = addressDetails.data
    ;

    if(addressDetails.isFailure() || !addressDetailsData[oThis.address]){
      return Promise.resolve(responseHelper.error("s_a_gtt_1", "address data not found for : "+oThis.address, ));
    }

    // get address token transfers
    const addressId = addressDetailsData[oThis.address]['id']
      , addressTokenTransfersObject =  new AddressTokenTransfersModelKlass(oThis.chainId)
      , offset =  (oThis.pagePayload.page_no-1)*(oThis.pageSize-1)
      , timestamp = oThis.pagePayload.timestamp
    ;
    
    var tokenTransfersData = await addressTokenTransfersObject.select('*')
      .where(['address_id = ? and tx_timestamp <= ? ', addressId, timestamp])
      .order_by('tx_timestamp desc, id desc')
      .offset(offset)
      .limit(oThis.pageSize)
      .fire();

    if(tokenTransfersData.length === 0){
      return Promise.resolve(responseHelper.error("s_a_gtt_2", "address token transfers not found for : ", oThis.address));
    }

    // set next page and previous page payload
    finalTokenTransferData['next_page_payload'] = oThis.getNextPagePaylaodForAddressTransactions(tokenTransfersData);
    finalTokenTransferData['prev_page_payload'] = oThis.getPrevPagePaylaodForAddressTransactions(tokenTransfersData);

    // remove extra token transfer data
    if(tokenTransfersData.length == oThis.pageSize){
      tokenTransfersData.pop()
    }

    const contractAddressArray = []
      , addressIds = []
      , transactionIds = []
    ;


    for (var i = 0; i < tokenTransfersData.length; i++){
      const transfer = tokenTransfersData[i];

      addressIds.push(transfer.address_id, transfer.corresponding_address_id, transfer.contract_address_id);
      contractAddressArray.push(transfer.contract_address_id);
      transactionIds.push(transfer.transaction_hash_id);
    }
    // get branded tokens
    const brandedTokenDetails = await new BrandedTokenCacheKlass({chain_id: oThis.chainId, contract_address_ids: contractAddressArray}).fetch();
    const brandedTokens = brandedTokenDetails.data;

    //get addresses data
    const addressData = await new AddressesCacheKlass({chain_id: oThis.chainId, ids: addressIds}).fetch();
    if(addressData.isFailure() || !addressData.data){
      return responseHelper.error('cmm_tt_3', 'No Data found');
    }
    const addresses = addressData.data;

    // get transfers hash data
    const transactionHashData = await new TransactionHashCacheKlass({chain_id: oThis.chainId, ids: transactionIds}).fetch();
    if(transactionHashData.isFailure() || !transactionHashData.data){
      return responseHelper.error('cmm_tt_4', 'No Data found');
    }
    const transactionHashes = transactionHashData.data;

    //format and set token transfer
    finalTokenTransferData['token_transfers'] = oThis.formatAddressTokenTransferData(tokenTransfersData, addresses, transactionHashes);

    //set contract address
    if (brandedTokenDetails.isSuccess()){
      finalTokenTransferData['contract_addresses'] = brandedTokens;
    }

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
};

GetAddressTokenTransfersKlass.prototype.formatAddressTokenTransferData = function (tokenTransfersData, addresses, transactionHashes){

  const formattedResponse = [];
  for (var i=0; i < tokenTransfersData.length ; i++){
    const formattedTransfer = {}
      , transfer = tokenTransfersData[i]
    ;

    formattedTransfer.id = transfer.id;
    formattedTransfer.address = addresses[transfer.address_id].address_hash;
    formattedTransfer.corresponding_address = addresses[transfer.corresponding_address_id].address_hash;
    formattedTransfer.transaction_hash = transactionHashes[transfer.transaction_hash_id].transaction_hash;
    formattedTransfer.contract_address = addresses[transfer.contract_address_id].address_hash;
    formattedTransfer.contract_address_id = transfer.contract_address_id;
    formattedTransfer.tokens = transfer.tokens;
    formattedTransfer.inflow = transfer.inflow;
    formattedTransfer.tx_timestamp = transfer.tx_timestamp;

    formattedResponse.push(formattedTransfer);
  }

  return formattedResponse;
}


GetAddressTokenTransfersKlass.prototype.getNextPagePaylaodForAddressTransactions = function (requestResponse){

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

GetAddressTokenTransfersKlass.prototype.getPrevPagePaylaodForAddressTransactions = function (requestResponse){

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

module.exports = GetAddressTokenTransfersKlass;