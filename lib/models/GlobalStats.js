'use strict';
/**
 * GlobalStats model
 *
 * @module lib/models/GlobalStats
 */
const rootPrefix = '../..',
  OSTBase = require('@openstfoundation/openst-base'),
  SharedBase = require(rootPrefix + '/lib/models/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

let longToShortNamesMap = null,
  shortNameToDataType = null,
  shortToLongNamesMap = null;

class GlobalStats extends SharedBase {
  /**
   * Constructor for GlobalStats model
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
      stats: 'st',
      totalMarketCap: 'tmc',
      totalTokenHolders: 'tth',
      totalEconomies: 'teco'
    };
  }

  /**
   * Default short name to data type map
   *
   * @returns {Object}
   */
  get defaultShortNameToDataType() {
    return {
      st: 'N',
      tmc: 'N',
      tth: 'N',
      teco: 'N'
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
    return this.tablePrefix + 'global_stats';
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

    keyObj[oThis.shortNameFor('stats')] = { N: params['stats'].toString() };

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
            AttributeName: oThis.shortNameFor('stats'),
            KeyType: 'HASH'
          } //Partition key
        ],
        AttributeDefinitions: [{ AttributeName: oThis.shortNameFor('stats'), AttributeType: 'N' }],
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

  async getData() {
    const oThis = this;

    let getKeys = [],
      shortNameForStats = oThis.shortNameFor('stats'),
      dataTypeForStats = oThis.shortNameToDataType[shortNameForStats];

    let buffer = {};
    buffer[shortNameForStats] = { [dataTypeForStats]: '1' };
    getKeys.push(buffer);

    let batchGetParams = { RequestItems: {} };
    batchGetParams.RequestItems[oThis.tableName()] = {
      Keys: getKeys,
      ConsistentRead: oThis.consistentRead
    };

    let batchGetRsp = await oThis.ddbServiceObj.batchGetItem(batchGetParams, 10);

    if (batchGetRsp.isFailure()) {
      return Promise.reject(batchGetRsp);
    }

    let unprocessedKeys = batchGetRsp.data.UnprocessedKeys;

    if (Object.keys(unprocessedKeys).length > 0) {
      let unprocessedKeysLength = unprocessedKeys[oThis.shardName]['Keys'].length;
      logger.error(`batchGetItem GlobalStats chainId : ${oThis.chainId} UnprocessedKeys : ${unprocessedKeysLength}`);
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_m_gs_1',
          api_error_identifier: 'ddb_batch_get_failed',
          debug_options: { unProcessedCount: unprocessedKeysLength }
        })
      );
    }

    let dbRows = batchGetRsp.data.Responses[oThis.tableName()],
      formatterResponse = oThis._formatRowsFromDynamo(dbRows, 'stats');

    return Promise.resolve(responseHelper.successWithData(formatterResponse));
  }
}

InstanceComposer.registerAsShadowableClass(GlobalStats, coreConstants.icNameSpace, 'GlobalStats');

module.exports = GlobalStats;
