'use strict';
/**
 * This service aggregates data from economies table.
 *
 * @module services/economy/GlobalAggregator
 */

const OSTBase = require('@ostdotcom/base');

const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');
require(rootPrefix + '/lib/models/GlobalStats');

class GlobalAggregator {
  /**
   * Constructor for EconomyAggregator
   *
   *
   * @constructor
   */
  constructor() {
    const oThis = this;
    oThis.chains = [];
    oThis.batchWriteArray = [];
    oThis.consistentRead = false;
  }

  async asyncPerform() {
    const oThis = this;

    await oThis.getEconomies();

    await oThis.insertGlobalStats();
  }

  async getEconomies() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      Economy = blockScanner.model.Economy,
      economy = new Economy({ consistentRead: false }),
      shortNameForTotalTokenHolder = economy.shortNameFor('totalTokenHolders'),
      shortNameForMarketCap = economy.shortNameFor('marketCap'),
      datatypeForTth = economy.shortNameToDataType[shortNameForTotalTokenHolder],
      datatypeForMc = economy.shortNameToDataType[shortNameForMarketCap];

    let evaluateFlag = true,
      economiesDataArray = [],
      globalMarketCap = 0,
      globalTokenHolders = 0,
      LastEvaluatedKey = {};

    while (evaluateFlag) {
      let economyData = await oThis.getAllData(LastEvaluatedKey);
      LastEvaluatedKey = economyData.data.LastEvaluatedKey;

      economiesDataArray.push.apply(economiesDataArray, economyData.data.Items);

      if (!LastEvaluatedKey) {
        evaluateFlag = false;
      }
    }

    for (let index = 0; index < economiesDataArray.length; index++) {
      let economyRow = economiesDataArray[index];

      globalMarketCap = basicHelper
        .convertToBigNumber(globalMarketCap)
        .add(basicHelper.convertToBigNumber(economyRow[shortNameForMarketCap][datatypeForMc]));
      globalTokenHolders = basicHelper
        .convertToBigNumber(globalTokenHolders)
        .add(basicHelper.convertToBigNumber(economyRow[shortNameForTotalTokenHolder][datatypeForTth]));
    }

    let batchWriteParam = {
      stats: '1',
      totalMarketCap: globalMarketCap.toString(10),
      totalTokenHolders: globalTokenHolders.toString(10),
      totalEconomies: economiesDataArray.length.toString()
    };

    oThis.batchWriteArray.push(batchWriteParam);
  }

  async getAllData(LastEvaluatedKey) {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      Economy = blockScanner.model.Economy,
      economy = new Economy({ consistentRead: false }),
      shortNameForTotalTokenHolder = economy.shortNameFor('totalTokenHolders'),
      shortNameForMarketCap = economy.shortNameFor('marketCap');

    let queryParams = {
      TableName: economy.tableName(),
      ProjectionExpression: `${shortNameForTotalTokenHolder},${shortNameForMarketCap}`,
      ConsistentRead: false
    };

    if (Object.keys(LastEvaluatedKey).length > 0) {
      queryParams['ExclusiveStartKey'] = LastEvaluatedKey;
    }

    console.log('=====>queryparams', queryParams);
    let response = await economy.ddbServiceObj.scan(queryParams);

    console.log('====>>DDB response', response);

    if (response.isFailure()) {
      return response;
    }

    if (!response.data.Items || !response.data.Items[0]) {
      return Promise.resolve(responseHelper.successWithData({}));
    }

    return Promise.resolve(response);
  }

  async insertGlobalStats() {
    const oThis = this,
      GlobalStats = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GlobalStats'),
      globalStatsObj = new GlobalStats({ consistentRead: oThis.consistentRead });
    await globalStatsObj.batchWriteItem(oThis.batchWriteArray);
  }
}

InstanceComposer.registerAsShadowableClass(GlobalAggregator, coreConstants.icNameSpace, 'GlobalAggregator');
