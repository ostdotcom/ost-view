"use strict";

const rootPrefix = '../..'
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , graphDataConst = require(rootPrefix + '/lib/global_constant/graph_data')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , util = require(rootPrefix + '/lib/util')
;

const timeFrames = {
    '1': graphDataConst.hour,
    '2': graphDataConst.day,
    '3': graphDataConst.month
  }
  , invertedTimeFrames = util.invert(timeFrames)
;

/**
 * constructor
 *
 * @param {Object} chainId - chain id
 *
 * @constructor
 */
const GraphDataKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

GraphDataKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const GraphDataSpecificPrototype = {

  tableName: coreConstants.GRAPH_DATA_TABLE_NAME,

  timeFrames: timeFrames,

  invertedTimeFrame: invertedTimeFrames,

  enums: {
    'time_frame': {
      val: timeFrames,
      inverted: invertedTimeFrames
    }
  },

  getGraph : function(params){
    const oThis = this
      , brandedTokenId = params.brandedTokenId
      , timeFrame = params.timeFrame
      , noOfRows = params.noOfRows
      , selectColumns = params.selectColumns
    ;
    let response = oThis.select(selectColumns).where({contract_address_id: brandedTokenId, time_frame: oThis.invertedTimeFrame[timeFrame]})
      .group_by('time_id')
      .order_by('time_id')
      .limit(noOfRows)
      .fire();

    return Promise.resolve(response);
  },

  getTypeGraph : function(params){
    const oThis = this
      , brandedTokenId = params.brandedTokenId
      , timeFrame = params.timeFrame
      , selectColumns = params.selectColumns
    ;
    let response = oThis.select(selectColumns).where({contract_address_id: brandedTokenId, time_frame: oThis.invertedTimeFrame[timeFrame]})
      .group_by('branded_token_transaction_type_id')
      .fire();

    return Promise.resolve(response);
  },

  getHourGraph : function(brandedTokenId, selectColumnsArray) {
    const oThis = this;
    let selectColumns = '';
    for (let ind = 0; ind < selectColumnsArray;ind++) {
      selectColumns += 'SUM(' + selectColumnsArray[ind] + ')';
    }
    return oThis.getGraph({
      brandedTokenId :brandedTokenId,
      timeFrame :'fiveMin',
      noOfRows : 12,
      selectColumns : selectColumns
    });
  },

  getDayGraph : function(brandedTokenId, selectColumnsArray) {
    const oThis = this;
    let selectColumns = '';
    for (let ind = 0; ind < selectColumnsArray;ind++) {
      selectColumns += 'SUM(' + selectColumnsArray[ind] + ')';
    }
    return oThis.getGraph({
      brandedTokenId :brandedTokenId,
      timeFrame :'hour',
      noOfRows : 24,
      selectColumns: selectColumns
    });
  },

  getWeekGraph : function(brandedTokenId, selectColumnsArray) {
    const oThis = this;
    let selectColumns = '';
    for (let ind = 0; ind < selectColumnsArray;ind++) {
      selectColumns += 'SUM(' + selectColumnsArray[ind] + ')';
    }
    return oThis.getGraph({
      brandedTokenId :brandedTokenId,
      timeFrame :'day',
      noOfRows : 7,
      selectColumns: selectColumns
    });
  },

  getMonthGraph : function(brandedTokenId, selectColumnsArray) {
    const oThis = this;
    let selectColumns = '';
    for (let ind = 0; ind < selectColumnsArray;ind++) {
      selectColumns += 'SUM(' + selectColumnsArray[ind] + ')';
    }
    return oThis.getGraph({
      brandedTokenId :brandedTokenId,
      timeFrame :'day',
      noOfRows : 30,
      selectColumns : selectColumns
    });

  },

  getYearGraph : function(brandedTokenId, selectColumnsArray) {
    const oThis = this;
    let selectColumns = '';
    for (let ind = 0; ind < selectColumnsArray;ind++) {
      selectColumns += 'SUM(' + selectColumnsArray[ind] + ')';
    }
    return oThis.getGraph({
      brandedTokenId :brandedTokenId,
      timeFrame :'month',
      noOfRows : 12,
      selectColumns : selectColumns
    });
  }
};

Object.assign(GraphDataKlass.prototype, GraphDataSpecificPrototype);

GraphDataKlass.DATA_SEQUENCE_ARRAY = ['contract_address_id', 'time_frame', 'time_id', 'branded_token_transaction_type_id', 'total_transactions', 'total_transaction_value', 'total_transfers', 'total_transfer_value', 'token_ost_volume'];

module.exports = GraphDataKlass;

// ttk = require('./app/models/graph_data')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);