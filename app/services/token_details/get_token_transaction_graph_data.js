"use strict";

const rootPrefix = "../../.."
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , coreConstant = require(rootPrefix + '/config/core_constants')
  , AddressesIdMapCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap')
  ,TokenTransactionGraphCacheKlass = require(rootPrefix + '/lib/cache_management/token_transaction_graph_data')
;

/**
 * Get details of volume graph for a branded token
 *
 * @param {object} params - this is object with keys.
 *                 chainId - Chain Id.
 *                 contractAddress - contract address of branded token
 *
 * @Constructor
 */
const GetTokenTransactionGraphKlass = function(params){
  const oThis = this;

  oThis.chainId = params.chainId;
  oThis.contractAddress = params.contractAddress;
  oThis.duration = params.duration;
};


GetTokenTransactionGraphKlass.prototype = {

  /**
   * Perform operation of getting recent token transfers details
   *
   * @return {Promise<void>}
   */
  perform: async function () {
    const oThis = this;

    let contractAddressId = 0;

    try {
      //Check for common data
      if (Number(oThis.contractAddress) !== 0) {
        const response = await new AddressesIdMapCacheKlass({
          chain_id: oThis.chainId,
          addresses: [oThis.contractAddress]
        }).fetch()
          , responseData = response.data;
        if (response.isFailure() || !responseData[oThis.contractAddress]) {
          throw "GetTokenTransactionGraphKlass :: AddressesIdMapCacheKlass :: response Failure Or contract Address not found ::" + oThis.contractAddress;
        }
        contractAddressId = responseData[oThis.contractAddress].id;
      } else {
        contractAddressId = 0;
      }

      const tokenTransactionGraphResponse = await new TokenTransactionGraphCacheKlass({
        chain_id: oThis.chainId,
        contract_address_id: contractAddressId,
        duration: oThis.duration
      }).fetch();

      if (tokenTransactionGraphResponse.isFailure()) {
        return Promise.resolve(responseHelper.error("a_s_ttrgd_1", "Fail to fetch graph data for token transactions"));
      }
      return Promise.resolve(responseHelper.successWithData(tokenTransactionGraphResponse.data));
    } catch (err) {
      return Promise.resolve(responseHelper.error("a_s_ttrgd_2", "Fail to fetch graph data for token transactions"+ err));
    }
  }
};

module.exports = GetTokenTransactionGraphKlass;

/*
  TransactionServiceKlass = require('./app/services/token_details/get_token_transaction_graph_data.js');
  new TransactionServiceKlass({chainId:1409, contractAddress: '0xae2ac19e2c8445e9e5c87e5412cf8ed419f1a5c6', duration:'hour'}).perform().then(console.log);
 */