"use strict";

const rootPrefix = "../../.."
  , transactionCacheKlass = require(rootPrefix + '/lib/cache_management/transaction')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , TokenTransferKlass = require(rootPrefix + '/app/services/token_transfers/get_details')

;

/**
 * Get Details of a block
 *
 * @param {object} params - this is object with keys.
 *                 transactionHash - transaction hash to fetch data for.
 *                 chainId - Chain Id.
 *
 * @Constructor
 */
const GetTransactionDetailsKlass = function(params){
  const oThis = this;

  oThis.transactionHash = params.transactionHash;
  oThis.chainId = params.chainId;
};

GetTransactionDetailsKlass.prototype = {

  /**
   * Perform operation of getting transaction details
   *
   * @return {Promise<void>}
   */
  perform: async function(){
    const oThis = this
      , transactionData = await new transactionCacheKlass({chain_id: oThis.chainId, transaction_hash: oThis.transactionHash}).fetch()
    ;

    if(transactionData.isFailure()){
      return Promise.resolve(responseHelper.error('s_t_gd_1','transaction data not found'));
    }

    const txDetails = transactionData.data
      , finalTransactionData = {}
      , tokenTransferIds = txDetails.token_transfer_ids
      , tokenTransferData = await new TokenTransferKlass({chain_id: oThis.chainId, token_transfer_ids: tokenTransferIds}).perform()
      , tokenTransaferDetails = tokenTransferData.data
    ;

    finalTransactionData['transaction_details'] =  txDetails.transaction_details;
    finalTransactionData['token_transfer_details'] = tokenTransaferDetails.token_transfers;
    finalTransactionData['contract_addresses'] = tokenTransaferDetails.contract_addresses;

    return Promise.resolve(responseHelper.successWithData(finalTransactionData));
  }
};

module.exports = GetTransactionDetailsKlass;