"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_management/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , GraphDataKlass = require(rootPrefix +'/app/models/graph_data')
  , GraphConst = require(rootPrefix + '/lib/global_constant/graph_data')
  , AggregatedDataKlass = require(rootPrefix + '/app/models/aggregated')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , GraphUtils = require(rootPrefix + '/lib/graphTimeUtils')
  , TokenUnits = require(rootPrefix + '/helpers/tokenUnits')
;

/**
 * @constructor
 *
 * @param {Object} params - cache key generation & expiry related params
 *                 block_number -  Block number to fetch data for
 *                 chain_id - Chain id
 *
 */
const TokenTransferGraphData = function(params) {

  const oThis = this;

  oThis.chainId = params.chain_id;
  oThis.contractAddressId = params.contract_address_id;
  oThis.duration = params.duration.toLowerCase();
  oThis.latestTimestamp = params.latestTimestamp;

  baseCache.call(this, params);

  oThis.useObject = true;

};

TokenTransferGraphData.prototype = Object.create(baseCache.prototype);

const TokenTransferGraphDataPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function() {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "ttgd_" + 'cid_' + oThis.contractAddressId + 'd_' + oThis.duration + 'lts_' + oThis.latestTimestamp;

    return oThis.cacheKey;

  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function() {

    const oThis = this;

    oThis.cacheExpiry = 301; // 5 min ;
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
    ;

    let graphDataObject;
    let graphDataObjectResponse;
    let condition = Number(oThis.contractAddressId) === 0 ? '!=' : '=';
    if (String(oThis.duration) !== 'hour'){

      graphDataObject = new GraphDataKlass(oThis.chainId);
      graphDataObjectResponse = await graphDataObject.select('timestamp, SUM(total_transfers) as token_transfers, SUM(total_transactions) as token_transactions ,SUM(token_ost_volume) as token_ost_volume')
        .where(['contract_address_id'+ condition + '? AND time_frame=?' , oThis.contractAddressId, graphDataObject.invertedTimeFrames[oThis.getTimeFrame()]])
        .group_by('timestamp')
        .order_by('timestamp desc')
        .limit(30)
        .fire();
    } else {
      graphDataObject = new AggregatedDataKlass(oThis.chainId);
      graphDataObjectResponse = await graphDataObject.select('timestamp, SUM(total_transfers) as token_transfers, SUM(total_transactions) as token_transactions, SUM(token_ost_volume) as token_ost_volume')
        .where(['contract_address_id'+ condition + '?' , oThis.contractAddressId])
        .group_by('timestamp')
        .order_by('timestamp desc')
        .limit(30)
        .fire();
    }
    let data = [];
    if (graphDataObjectResponse) {
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

    let dpArray = [];
    if (graphDataObjectResponse instanceof Array && graphDataObjectResponse.length > 0) {
      let graphHash = {};
      for (let ind=0;ind<graphDataObjectResponse.length ; ind++) {
        graphHash[graphDataObjectResponse[ind].timestamp] = graphDataObjectResponse[ind];
      }
      const graphUtils = GraphUtils.newInstance(oThis.latestTimestamp, oThis.duration);

      let haveData = false;
      let dpTimestamp = graphUtils.setGraphStartTime();
      while(dpTimestamp < oThis.latestTimestamp) {
        if(graphHash[dpTimestamp]) {
          haveData = true;

          graphHash[dpTimestamp].token_ost_volume = TokenUnits.convertToNormal(graphHash[dpTimestamp].token_ost_volume).toString(10);
          dpArray.push(graphHash[dpTimestamp]);
        } else {
          dpArray.push({timestamp: dpTimestamp,
            token_transfers: 0,
            token_transactions: 0,
            token_ost_volume: 0
          });
        }
        dpTimestamp = graphUtils.getNextTimestamp();
      }
      if (!haveData) {
        dpArray = [];
      }
    }
    return dpArray;
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

Object.assign(TokenTransferGraphData.prototype, TokenTransferGraphDataPrototype);

module.exports = TokenTransferGraphData;

/*
 TokenTransfer = require('./lib/cache_management/token_transfer_graph_data')
 new TokenTransfer({chain_id : 1409, contract_address_id: 35, duration: 'hour'}).fetchDataFromSource().then(console.log);
*/