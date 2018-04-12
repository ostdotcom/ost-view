"use strict";
/**
 * Build Graph Data using aggregate table
 *
 * @module lib/block_utils/graph_data_builder
 */
const rootPrefix = "../.."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , GraphUtils = require(rootPrefix + '/lib/graphTimeUtils')
  , GraphDataKlass = require(rootPrefix + '/app/models/graph_data')
  , AggregatedDataModelKlass = require(rootPrefix + '/app/models/aggregated')
  , graphDataConst = require(rootPrefix + '/lib/global_constant/graph_data')
  , CronDetailsModelKlass = require(rootPrefix + '/app/models/cron_detail')
  , cronDetailConst = require(rootPrefix + '/lib/global_constant/cron_details')
  , TokenTransferGraphCacheKlass = require(rootPrefix + '/lib/cache_management/token_transfer_graph_data')
  , TransactionTypeGraphCacheKlass = require(rootPrefix + '/lib/cache_management/transaction_type_graph_data')
;


/**
 * Constructor to create object of GraphDataBuilder
 *
 * @param {Integer} chainId - chainId of the block chain
 * @param {Integer} timestamp - latest timestamp
 *
 * @constructor
 */
const GraphDataBuilder = function (chainId, timestamp) {
  this.chainId = chainId;
  this.lastAggregateTimestamp = timestamp;
};


/**
 * Method to fetch block using blockNumber
 * @return {null}
 */
GraphDataBuilder.prototype.perform = async function () {
  const oThis = this;

  try {

    await oThis.processHourTimeFrame();

    await oThis.processDayTimeFrame();

    await oThis.processMonthTimeFrame();

  } catch(err) {
    logger.error('Graph data builder :: perform :: try catch', err);
    return responseHelper.error('l_bu_gdb_1', 'Graph data builder :: perform :: try catch' + err);
  }

};

GraphDataBuilder.prototype.formatGraphData = function (aggregateData) {
  const row = []
    , contract_address_id = aggregateData.contract_address_id || 0
    , branded_token_transaction_type_id = aggregateData.branded_token_transaction_type_id || 0
    , transaction_sum = aggregateData.transaction_sum || 0
    , transaction_value_sum = aggregateData.transaction_value_sum || 0
    , transfers_sum = aggregateData.transfers_sum || 0
    , transfer_value_sum = aggregateData.transfer_value_sum || 0
    , token_ost_volume_sum = aggregateData.token_ost_volume_sum || 0
  ;

  row.push(contract_address_id);
  row.push(aggregateData.time_frame);
  row.push(aggregateData.timestamp);
  row.push(branded_token_transaction_type_id);
  row.push(transaction_sum);
  row.push(transaction_value_sum);
  row.push(transfers_sum);
  row.push(transfer_value_sum);
  row.push(token_ost_volume_sum);

  return row;
};

GraphDataBuilder.prototype.clearGraphCache = async function (aggregateData) {
  const oThis = this
    , contract_address_id = aggregateData.contract_address_id || 0
    , durationArray = ['hour','day','week','month','year']
  ;
  try {
    let cacheObj;

    for (let index = 0; index < durationArray.length; index++) {
      cacheObj = new TokenTransferGraphCacheKlass({
        chain_id: oThis.chainId,
        contract_address_id: contract_address_id,
        duration: durationArray[index]
      });
      await cacheObj.clear();
    }

    for (let index = 0; index < durationArray.length; index++) {
      cacheObj = new TransactionTypeGraphCacheKlass({
        chain_id: oThis.chainId,
        contract_address_id: contract_address_id,
        duration: durationArray[index]
      });
      await cacheObj.clear();
    }
  } catch(error) {
    logger.error('GraphDataBuilder :: clearGraphCache :: error in graph cache ', error);
  }
};

/**
 * Update graph Data
 * @param time_id_1 time_id one
 * @param time_id_2 time_id two.
 * @param timeFrame time frame
 * @return {Promise<void>}
 */
GraphDataBuilder.prototype.fetchAndUpdateGraphData = async function (time_id_1, time_id_2, timeFrame) {
  const oThis = this
    ,BATCH_SIZE = 50;
  let offset = 0;
  try {

    while(true) {
      let aggregateDataResponse = await new AggregatedDataModelKlass(oThis.chainId).select('contract_address_id, branded_token_transaction_type_id, SUM(total_transactions) as transaction_sum, ' +
        'SUM(total_transaction_value) as transaction_value_sum, SUM(total_transfers) as transfers_sum, SUM(total_transfer_value) as transfer_value_sum , SUM(token_ost_volume) as token_ost_volume_sum')
        .where(['timestamp>=? AND timestamp<?', time_id_1, time_id_2])
        .group_by('contract_address_id, branded_token_transaction_type_id')
        .order_by(['contract_address_id', 'branded_token_transaction_type_id'])
        .limit(BATCH_SIZE)
        .offset(offset)
        .fire();

      let aggregateDataList = [];
      if (aggregateDataResponse && aggregateDataResponse.length > 0) {
        for(let ind = 0;ind < aggregateDataResponse.length; ind++) {
          let aggregateData = aggregateDataResponse[ind];
          aggregateData.time_frame = (new GraphDataKlass(oThis.chainId)).invertedTimeFrames[graphDataConst[timeFrame]];
          aggregateData.timestamp = time_id_1;

          //await oThis.clearGraphCache(aggregateData);

          let formattedGraphData = oThis.formatGraphData(aggregateData);
          aggregateDataList.push(formattedGraphData);
        }
      } else {
        break;
      }

      await new GraphDataKlass(oThis.chainId).insertMultiple(GraphDataKlass.DATA_SEQUENCE_ARRAY, aggregateDataList)
        .onDuplicate('total_transactions=VALUES(total_transactions), total_transaction_value=VALUES(total_transaction_value), ' +
          'total_transfers=VALUES(total_transfers), total_transfer_value=VALUES(total_transfer_value), token_ost_volume=VALUES(token_ost_volume)')
        .fire();

      offset+=BATCH_SIZE;
    }

    return Promise.resolve(true);
  } catch (err) {
    logger.error('GraphDataBuilder :: insertOrUpdateGraph Data', err);
    return Promise.resolve(false);
  }
};

GraphDataBuilder.prototype.processHourTimeFrame = async function () {
  const oThis = this;
  return await oThis.processTimeFrame('hour');
};

GraphDataBuilder.prototype.processDayTimeFrame = async function () {
  const oThis = this;
  return await oThis.processTimeFrame('day');
};

GraphDataBuilder.prototype.processMonthTimeFrame = async function () {
  const oThis = this;
  return await oThis.processTimeFrame('month');
};

/**
 *
 * @return {Promise<void>}
 */
GraphDataBuilder.prototype.processTimeFrame = async function (timeFrame) {
  const oThis = this
  ;

  try {
    //Get last inserted time_id for given timeFrame
    let cronResponse = await new CronDetailsModelKlass(oThis.chainId).select('data')
      .where(['cron_name = ?', CronDetailsModelKlass.graph_cron])
      .fire();

    // for failed status, we donot need to do anything as it is handled.
    let lastTimeId;
    let cronData = {};
    cronData[timeFrame] = {};
    if (cronResponse && cronResponse[0]['data'] ) {
      cronData = JSON.parse(cronResponse[0]['data']);
    }
    if (cronData[timeFrame].timestamp && Number(cronData[timeFrame].timestamp) !== 0) {
      lastTimeId = cronData[timeFrame].timestamp;
    } else {
      let minTimeIdResponse = await new AggregatedDataModelKlass(oThis.chainId).select('MIN(timestamp) as min_time_id')
        .fire();
      if (minTimeIdResponse && minTimeIdResponse[0]['min_time_id']) {
        lastTimeId = minTimeIdResponse[0]['min_time_id'];
      } else {
        throw 'No Data found in Aggregate Data table';
      }
    }

    const graphTimeObj = GraphUtils.newInstance(oThis.lastAggregateTimestamp, timeFrame, lastTimeId);

    let timeId_1 = graphTimeObj.getRoundOffTimestamp(lastTimeId);
    let timeId_2 = graphTimeObj.getNextTimeFrameTimestamp(timeId_1);
    //console.log("DEBUG...", timeId_1, timeId_2,lastTimeId );
    let limitBreak = false;
    while (true) {
      let response = await oThis.fetchAndUpdateGraphData(timeId_1, timeId_2, timeFrame);
      if (!response || timeId_2>=oThis.lastAggregateTimestamp) {
        limitBreak = timeId_2>=oThis.lastAggregateTimestamp;
        break;
      }
      timeId_1 = timeId_2;
      timeId_2 = graphTimeObj.getNextTimeFrameTimestamp(timeId_1);
    }

    //Update the status of graph cron
    let obj = new CronDetailsModelKlass(oThis.chainId)
      , cronStatus = obj.invertedStatuses[cronDetailConst.failedStatus];

    if(limitBreak){
      cronStatus = obj.invertedStatuses[cronDetailConst.completeStatus];
    }

    cronData[timeFrame].timestamp = timeId_1;
    await obj.update({status: cronStatus, data: JSON.stringify(cronData)}).where(['cron_name = ?', CronDetailsModelKlass.graph_cron])
      .fire();

  } catch (err) {
    logger.error('Graph data builder :: processTimeFrame ::', err);
  }
};

module.exports = {
  newInstance: function (chainId, timestamp) {
    return new GraphDataBuilder(chainId, timestamp);
  }
};