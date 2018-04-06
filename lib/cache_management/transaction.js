"use strict";

const rootPrefix = '../..'
    , baseCache = require(rootPrefix + '/lib/cache_management/base')
    , TransactionModelKlass = require(rootPrefix + '/app/models/transaction')
    , TransactionHashModelKlass = require(rootPrefix + '/app/models/transaction_hash')
    , TransactionExtendedDetailsModelKlass = require(rootPrefix + '/app/models/transaction_extended_detail')
    , TransactionTokenTransferModelKlass = require(rootPrefix + '/app/models/token_transfer')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * @constructor
 * @augments TransactionCacheKlass
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const TransactionCacheKlass = function(params) {

  const oThis = this;

  oThis.transactionHash = params.transaction_hash;
  oThis.chainId = params.chain_id;

  baseCache.call(this, params);

  oThis.useObject = true;

};

TransactionCacheKlass.prototype = Object.create(baseCache.prototype);

const TransactionCacheKlassPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function() {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "t_" + oThis.transactionHash ;

    return oThis.cacheKey;

  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function() {

    const oThis = this;

    oThis.cacheExpiry = 86400; // 24 hours ;

    return oThis.cacheExpiry;

  },
  /**
   * fetch data from source
   *
   * @return {Result}
   */
  fetchDataFromSource: async function() {

    const oThis = this
      , transactionObject = new TransactionModelKlass(oThis.chainId)
      , transactionHashObject = new TransactionHashModelKlass(oThis.chainId)
      , transactionExtendedDetailsObject = new TransactionExtendedDetailsModelKlass(oThis.chainId)
      , transactionTokenTransferObject = new TransactionTokenTransferModelKlass(oThis.chainId)
      ;

    const transactionHashData = await transactionHashObject.select('id').where(['transaction_hash = ? ',oThis.transactionHash]).fire();

    if (transactionHashData.length === 0){
      console.log('transactionHashData',transactionHashData);
      const errString = 'transaction hash not found for '+oThis.transactionHash;
      return Promise.resolve((responseHelper.error('cm_t_1', errString)));
    }

    console.log("transactionHashData : ",transactionHashData);
    const trHashId = transactionHashData[0].id
      , transactionData = await transactionObject.select('id, transaction_hash_id, block_number, gas_used, gas_price, tokens, block_timestamp, status')
                .where(['transaction_hash_id = ?', trHashId]).fire()
      , transactionInputData = await transactionExtendedDetailsObject.select('input_data').where(['transaction_hash_id = ?', trHashId]).fire()
      ;


    if(!transactionData[0]){
      return Promise.resolve((responseHelper.error('cm_t_2', 'transaction data not found.')));
    }

    const trHashDetails = transactionData[0]
      ;
    trHashDetails.transaction_hash = oThis.transactionHash;
    trHashDetails.input_data = transactionInputData[0] && transactionInputData[0].input_data;


    //get token transfer
    const tokenTransferData  = await  transactionTokenTransferObject.select('id').where(['transaction_hash_id = ?', trHashId]).fire()
      , tokenTransferIds = []
    ;


    if (tokenTransferData && tokenTransferData.length > 0){

      for (var i = 0; i< tokenTransferData.length; i++){
        tokenTransferIds.push(tokenTransferData[i]['id']);
      }
    }

    const finalTransactionData  = {};

    finalTransactionData['token_transfer_ids'] = tokenTransferIds;
    finalTransactionData['transaction_details'] = trHashDetails;

    return Promise.resolve(responseHelper.successWithData(finalTransactionData));

  }

};

Object.assign(TransactionCacheKlass.prototype, TransactionCacheKlassPrototype);

module.exports = TransactionCacheKlass;