'use strict';
/**
 * BaseCurrencyModel model
 *
 * @module lib/models/BaseCurrencyModel
 */
const rootPrefix = '../..',
  OSTBase = require('@ostdotcom/base'),
  SharedBase = require(rootPrefix + '/lib/models/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

let longToShortNamesMap = null,
  shortNameToDataType = null,
  shortToLongNamesMap = null;

class BaseCurrencyModel extends SharedBase {
  /**
   * Constructor for BaseCurrencyModel model
   *
   * @augments SharedBase
   *
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  get defaultLongToShortNamesMap() {
    return {
      name: 'nm',
      symbol: 'sym',
      decimal: 'dc',
      contractAddress: 'ca'
    };
  }

  /**
   * Default short name to data type map
   *
   * @returns {Object}
   */
  get defaultShortNameToDataType() {
    return {
      nm: 'S',
      sym: 'S',
      dc: 'N',
      ca: 'S'
    };
  }

  /**
   * Mapping of long column names to their short names.
   *
   * @returns {{chainId: string, totalSupply: string, totalMarketCap: string, totalTokenHolders: , communities: , }}
   */
  get longToShortNamesMap() {
    const oThis = this;

    return oThis.getSetLongToShortNamesMap(longToShortNamesMap);
  }

  /**
   * Mapping of long column names to their short names.
   *
   * @returns {Object|*}
   */
  get shortToLongNamesMap() {
    const oThis = this;

    return oThis.getSetShortToLongNamesMap(shortToLongNamesMap);
  }

  /**
   * Mapping for short names to data types.
   *
   * @returns {{id: string, sn: string, iafa: string}}
   */
  get shortNameToDataType() {
    const oThis = this;

    return oThis.getSetShortNameToDataType(shortNameToDataType);
  }

  /**
   * Returns the table name.
   *
   * @returns {String}
   */
  tableName() {
    return this.sharedDdbTablePrefix + 'base_currencies';
  }

  /**
   * Returns condition expression
   *
   * @returns {String}
   */
  conditionExpression() {
    const oThis = this;
  }

  /**
   * Primary key of the table.
   *
   * @param params
   * @returns {Object}
   * @private
   */
  _keyObj(params) {
    const oThis = this,
      keyObj = {};

    keyObj[oThis.shortNameFor('contractAddress')] = { S: params['contractAddress'].toString() };

    return keyObj;
  }

  /**
   * Create table params
   *
   * @returns {Object}
   */
  tableSchema() {
    const oThis = this,
      tableSchema = {
        TableName: oThis.tableName(),
        KeySchema: [
          {
            AttributeName: oThis.shortNameFor('contractAddress'),
            KeyType: 'HASH'
          } //Partition key
        ],
        AttributeDefinitions: [
          {
            AttributeName: oThis.shortNameFor('contractAddress'),
            AttributeType: 'S'
          },
          {
            AttributeName: oThis.shortNameFor('name'),
            AttributeType: 'S'
          },
          {
            AttributeName: oThis.shortNameFor('symbol'),
            AttributeType: 'S'
          },
          {
            AttributeName: oThis.shortNameFor('decimal'),
            AttributeType: 'N'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        },
        SSESpecification: {
          Enabled: false
        }
      };

    return tableSchema;
  }

  async getData(baseCurrencyContractAddresses) {
    const oThis = this;

    let getKeys = [],
      shortNameForContractAddress = oThis.shortNameFor('contractAddress'),
      dataTypeForContractHash = oThis.shortNameToDataType[shortNameForContractAddress];

    for (let i = 0; i < baseCurrencyContractAddresses.length; i++) {
      let buffer = {};
      buffer[shortNameForContractAddress] = {};
      buffer[shortNameForContractAddress][dataTypeForContractHash] = baseCurrencyContractAddresses[i].toLowerCase();
      getKeys.push(buffer);
    }

    let batchGetParams = { RequestItems: {} };
    batchGetParams.RequestItems[oThis.tableName()] = {
      Keys: getKeys,
      ConsistentRead: oThis.consistentRead
    };

    let batchGetRsp = await oThis.ddbServiceObj.batchGetItem(batchGetParams);

    if (batchGetRsp.isFailure()) {
      return Promise.reject(batchGetRsp);
    }

    let unprocessedKeys = batchGetRsp.data.UnprocessedKeys;

    if (Object.keys(unprocessedKeys).length > 0) {
      let unprocessedKeysLength = unprocessedKeys[oThis.shardName]['Keys'].length;
      logger.error(`batchGetItem baseCurrencies UnprocessedKeys : ${unprocessedKeysLength}`);
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_m_bc_1',
          api_error_identifier: 'ddb_batch_get_failed',
          debug_options: { unProcessedCount: unprocessedKeysLength }
        })
      );
    }

    let dbRows = batchGetRsp.data.Responses[oThis.tableName()],
      formatterResponse = oThis._formatRowsFromDynamo(dbRows, 'contractAddress');

    return Promise.resolve(responseHelper.successWithData(formatterResponse));
  }
}

InstanceComposer.registerAsShadowableClass(BaseCurrencyModel, coreConstants.icNameSpace, 'BaseCurrencyModel');

module.exports = BaseCurrencyModel;
