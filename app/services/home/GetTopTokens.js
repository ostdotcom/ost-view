/*
 * GetTopTokens - Service for getting top tokens
 *
 */

const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  base64Helper = require(rootPrefix + '/lib/Base64/helper'),
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  tokenFormatter = require(rootPrefix + '/lib/formatter/entities/token'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');
require(rootPrefix + '/lib/cacheMultiManagement/BaseCurrency');

class GetTopTokens {
  /**
   * constructor
   *
   * @params
   * @param [paginationIdentifier] {String} - Identifier for pagination
   */
  constructor(params) {
    const oThis = this;

    oThis.paginationIdentifier = params.paginationIdentifier;

    oThis.economies = {};
    oThis.baseCurrencies = {};
    oThis.baseCurrencyContractAddresses = [];
  }

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/home/GetTopTokens.js');
      return responseHelper.error('s_h_gtt_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this;

    await oThis.getEconomies();

    await oThis.getBaseCurrencies();

    let result = {};

    result['tokens'] = oThis.economies;
    result['baseCurrencies'] = oThis.baseCurrencies;
    result['nextPagePayload'] = oThis.nextPagePayload;

    return responseHelper.successWithData(result);
  }

  /**
   * getEconomies
   *
   * @return {Promise<void>}
   */
  async getEconomies() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      Economy = blockScanner.model.Economy,
      economy = new Economy({ consistentRead: false }),
      longNameForBaseCurrencyContractAddress = 'baseCurrencyContractAddress';

    let decryptedLastEvaluatedKey = null,
      allShortNames = Object.keys(economy.shortNameToDataType);

    let keyObjs = await oThis.getPrimaryKeysToQuery();
    console.log('keyObjs-------------------------', keyObjs);

    let batchGetParams = { RequestItems: {} };
    batchGetParams.RequestItems[economy.tableName()] = {
      Keys: keyObjs,
      ProjectionExpression: allShortNames.join(','),
      ConsistentRead: oThis.consistentRead
    };

    let response = await economy.ddbServiceObj.batchGetItem(batchGetParams);

    console.log('response-------------------------', response);

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    let economyData = response.data.Responses[economy.tableName()];
    console.log('economyData-----Items--------------------', economyData);

    oThis.nextPagePayload = {};

    oThis.economies = [];
    oThis.baseCurrencyContractAddresses = [];

    let chainIdToContractAddressMap = {};

    for (let i = 0; i < economyData.length; i++) {
      let economyRow = economyData[i],
        keys = Object.keys(economyRow);

      let result = {};

      for (let j = 0; j < keys.length; j++) {
        let shortName = keys[j];
        result[economy.longNameFor(shortName)] = economyRow[shortName][economy.shortNameToDataType[shortName]];
      }

      if (result['baseCurrencyContractAddress']) {
        oThis.baseCurrencyContractAddresses.push(result[longNameForBaseCurrencyContractAddress]);
      }

      if (chainIdToContractAddressMap[result.chainId]) {
        chainIdToContractAddressMap[result.chainId].push(result.contractAddress);
      } else {
        chainIdToContractAddressMap[result.chainId] = [result.contractAddress];
      }

      oThis.economies.push(result);
    }

    let promiseArray = [];

    let tokenDataMap = {}; // Needed for uniquely identifying tokens

    for (let chainId in chainIdToContractAddressMap) {
      promiseArray.push(economy.getEconomyData(chainId, chainIdToContractAddressMap[chainId]));
    }

    let responses = await Promise.all(promiseArray);

    for (let i = 0; i < responses.length; i++) {
      let responseData = responses[i].data;

      for (let contractAddress in responseData) {
        response = responseData[contractAddress];
        tokenDataMap[response.chainId + response.contractAddress] = response;
      }
    }

    for (let i = 0; i < oThis.economies.length; i++) {
      let token = oThis.economies[i];
      Object.assign(token, tokenDataMap[token.chainId + token.contractAddress]);

      token['totalVolume'] = token.totalVolume;

      if (!token) {
        return responseHelper.error('s_h_gtt_2', 'Data Not found');
      }

      let result = await tokenFormatter.perform(token);

      oThis.economies[i] = result;
    }
  }

  /**
   * Get base currencies details for contract addresses
   *
   * @returns {Promise<void>}
   */
  async getBaseCurrencies() {
    const oThis = this;

    oThis.baseCurrencyContractAddresses = [...new Set(oThis.baseCurrencyContractAddresses)];

    if (oThis.baseCurrencyContractAddresses.length === 0) {
      return;
    }

    const BaseCurrencyCache = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'BaseCurrencyCache'),
      baseCurrencyCacheObj = new BaseCurrencyCache({
        baseCurrencyContractAddresses: oThis.baseCurrencyContractAddresses
      });

    let baseCurrencyCacheRsp = await baseCurrencyCacheObj.fetch();

    if (baseCurrencyCacheRsp.isSuccess()) {
      oThis.baseCurrencies = baseCurrencyCacheRsp.data;
    }
  }

  async getPrimaryKeysToQuery() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      Economy = blockScanner.model.Economy,
      economy = new Economy({ consistentRead: false }),
      shortNameForSortEconomyBy = economy.shortNameFor('sortEconomyBy');

    let decryptedLastEvaluatedKey = null;

    if (oThis.paginationIdentifier) {
      let decryptedLastEvaluatedKeyString = base64Helper.decode(oThis.paginationIdentifier);
      decryptedLastEvaluatedKey = JSON.parse(decryptedLastEvaluatedKeyString);
    }

    let queryParams = {
      TableName: economy.tableName(),
      IndexName: economy.thirdGlobalSecondaryIndexName(),
      KeyConditionExpression: '#sortEconomyBy = :sortEconomyBy',
      ExpressionAttributeNames: {
        '#sortEconomyBy': shortNameForSortEconomyBy
      },
      ExpressionAttributeValues: {
        ':sortEconomyBy': { [economy.shortNameToDataType[shortNameForSortEconomyBy]]: '1' }
      },
      Limit: coreConstants.DEFAULT_PAGE_SIZE,
      ScanIndexForward: false
    };

    if (decryptedLastEvaluatedKey) {
      queryParams['ExclusiveStartKey'] = decryptedLastEvaluatedKey;
    }

    let response = await economy.ddbServiceObj.query(queryParams);

    if (response.data.LastEvaluatedKey) {
      let encryptedLastEvaluatedKey = base64Helper.encode(JSON.stringify(response.data.LastEvaluatedKey));
      oThis.nextPagePayload = {
        paginationIdentifier: encryptedLastEvaluatedKey
      };
    }

    let economyData = response.data.Items,
      queryKeys = [];

    for (let i = 0; i < economyData.length; i++) {
      let economyRow = economyData[i],
        keys = Object.keys(economyRow);

      let result = {};

      for (let j = 0; j < keys.length; j++) {
        let shortName = keys[j];
        result[economy.longNameFor(shortName)] = economyRow[shortName][economy.shortNameToDataType[shortName]];
      }
      let keyObj = economy._keyObj(result);

      queryKeys.push(keyObj);
    }

    return queryKeys;
  }
}

InstanceComposer.registerAsShadowableClass(GetTopTokens, coreConstants.icNameSpace, 'GetTopTokens');
