"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_management/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , GraphDataKlass = require(rootPrefix +'/app/models/graph_data')
  , GraphConst = require(rootPrefix + '/lib/global_constant/graph_data')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , GraphUtils = require(rootPrefix + '/lib/graphTimeUtils')
  , BTTransactionTypesCacheKlass = require(rootPrefix + '/lib/cache_multi_management/branded_token_transaction_types')
;

/**
 * @constructor
 *
 * @param {Object} params - cache key generation & expiry related params
 *                 block_number -  Block number to fetch data for
 *                 chain_id - Chain id
 *
 */
const TransactionTypeGraphData = function(params) {

  const oThis = this;

  oThis.chainId = params.chain_id;
  oThis.contractAddressId = params.contract_address_id;
  oThis.duration = params.duration.toLowerCase();
  oThis.latestTimestamp = params.latestTimestamp;

  baseCache.call(this, params);

  oThis.useObject = true;

};

TransactionTypeGraphData.prototype = Object.create(baseCache.prototype);

const TokenTransferGraphDataPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function() {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "trtgd_" + 'cid_' + oThis.contractAddressId + 'd_' + oThis.duration + 'lts_' + oThis.latestTimestamp;

    return oThis.cacheKey;

  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function() {

    const oThis = this;

    oThis.cacheExpiry = 301; // 5 min;
    // oThis.cacheExpiry = 1; // 1 second ;

    return oThis.cacheExpiry;

  },
  /**
   * fetch data from source
   *
   * @return {Result}
   */
  fetchDataFromSource: async function() {

    const oThis = this
      , limitTime = await oThis.getLimitTime()
    ;


    let graphDataObject;
    let graphDataObjectResponse;

    graphDataObject = new GraphDataKlass(oThis.chainId);
    graphDataObjectResponse = await graphDataObject.select('contract_address_id, branded_token_transaction_type_id, SUM(total_transactions) as token_transactions')
      .where(['contract_address_id=? AND time_frame=? AND timestamp>=?', oThis.contractAddressId, graphDataObject.invertedTimeFrames[oThis.getTimeFrame()], limitTime])
      .group_by('contract_address_id, branded_token_transaction_type_id')
      .limit(200)
      .fire();

    let data = [];
    if (graphDataObjectResponse) {
      logger.log('GraphResponse', graphDataObjectResponse);
      data = await oThis.processResponse(graphDataObjectResponse);
    } else {
      logger.error('TokenTransferGraphData :: fetchDataFromSource :: graphDataObjectResponse is null');
      return Promise.resolve(responseHelper.error('l_cm_ttg_1', 'graphDataObjectResponse is null'))
    }
    return Promise.resolve(responseHelper.successWithData({graph_data: data}));
  },

  processResponse: async function (graphDataObjectResponse) {
    const oThis = this
    ;
    // logger.log("DEBUG",graphDataObjectResponse);
    let dpArray = [];
    let typeIds = [];
    if (graphDataObjectResponse instanceof Array && graphDataObjectResponse.length > 0) {
      for (let index = 0; index<graphDataObjectResponse.length;index++) {
        let obj = graphDataObjectResponse[index];
        typeIds.push(Number(obj.branded_token_transaction_type_id));
      }
      const cacheResponse = await new BTTransactionTypesCacheKlass({chain_id: oThis.chainId, ids: typeIds}).fetch();
      if (!cacheResponse.isSuccess()) {
        logger.error("TransactionTypeGraphData :: processResponse :: cacheResponse have failed");
        return dpArray;
      }
      const idTypeMap = cacheResponse.data;

      for (let index = 0; index<graphDataObjectResponse.length;index++) {
        let obj = graphDataObjectResponse[index];
        dpArray.push({type : idTypeMap[obj.branded_token_transaction_type_id].transaction_type , total_transfers: Number(obj.token_transactions)});
      }
    }

    return dpArray;
  },

  getLimitTime : async function(){
    const oThis = this
      ;
    const graphUtils = GraphUtils.newInstance(oThis.latestTimestamp, oThis.duration);
    return graphUtils.setGraphStartTime();
  },

  getTimeFrame : function() {
    const oThis = this;
    let duration = String(oThis.duration);
    if (duration === 'day') {
      return GraphConst.hour;
    }
    if (duration === 'month') {
      return GraphConst.day;
    }
    if (duration === 'week') {
      return GraphConst.day;
    }
    if (duration === 'year') {
      return GraphConst.month;
    }
    if (duration === 'all') {
      return GraphConst.month;
    }
    if (duration === 'hour'){
      return 'fiveMin';
    }

  }
};

Object.assign(TransactionTypeGraphData.prototype, TokenTransferGraphDataPrototype);

module.exports = TransactionTypeGraphData;

/*
 TokenTransfer = require('./lib/cache_management/transaction_type_graph_data')
 new TokenTransfer({chain_id : 1409, contract_address_id: 35, duration: 'month', latestTimestamp: 1521069581}).fetchDataFromSource().then(console.log);
*/