'use strict';
/**
 * Base class for all models
 *
 * @module lib/models/Base
 */
const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  errorConfig = basicHelper.getErrorConfig();

// Following require(s) for registering into instance composer
require(rootPrefix + '/lib/formatter/config');
require(rootPrefix + '/lib/providers/storage');

/**
 * Class for base class of all models
 *
 * @class
 */
class ModelBaseKlass {
  /**
   * Constructor for Base class for shared models
   *
   * @augments BaseModel
   *
   * @param {Object} params
   * @param {Number} params.consistentRead: (1,0)
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this,
      storageProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'storageProvider'),
      ostStorage = storageProvider.getInstance();

    oThis.consistentRead = !!params.consistentRead;

    oThis.ddbServiceObj = ostStorage.dynamoDBService;

    oThis.shardHelper = new ostStorage.model.DynamodbShardHelper({
      table_schema: oThis.tableSchema(),
      shard_name: oThis.tableName()
    });
  }

  get tablePrefix() {
    return this.ic().configStrategy.ddbTablePrefix;
  }

  get subEnvDdbTablePrefix() {
    return this.ic().configStrategy.subEnvDdbTablePrefix;
  }

  /**
   * It should return the table identifier. This is a human readable name determining the entity stored in the table.
   *
   * @returns {String}
   */
  tableIdentifier() {
    const oThis = this;
    return oThis.tableName();
  }

  /**
   * Create shard
   *
   * @returns {Promise<result>}
   */
  createTable() {
    const oThis = this;

    return oThis.shardHelper.createShard();
  }
  /**
   * Get set Mapping of long column names to their short names.
   *
   * 1. uses map defined by each model
   * 2. add extra mappings specified in config
   *
   * @param {Object} longToShortNamesMap: object's pointer provided by sub classes in which data would reside
   *
   * @returns {Object}
   */
  getSetLongToShortNamesMap(longToShortNamesMap) {
    const oThis = this;
    if (longToShortNamesMap) {
      return longToShortNamesMap;
    } else {
      longToShortNamesMap = oThis.defaultLongToShortNamesMap;
      const configFormatter = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'configFormatter'),
        extraStorageColumns = configFormatter.getExtraColumnConfigFor(oThis.tableIdentifier()),
        problematicLongNames = [];
      for (let columnLongName in extraStorageColumns) {
        if (longToShortNamesMap[columnLongName]) {
          problematicLongNames.push(columnLongName);
        } else {
          longToShortNamesMap[columnLongName] = extraStorageColumns[columnLongName]['shortName'];
        }
      }
      if (problematicLongNames.length > 0) {
        throw `Conflicting Long Name ${problematicLongNames}`;
      }
      return longToShortNamesMap;
    }
  }

  /**
   * Get set Mapping of short column names to their long names.
   *
   * @param {Object} shortToLongNamesMap: object's pointer provided by sub classes in which data would reside
   *
   * @returns {Object}
   */
  getSetShortToLongNamesMap(shortToLongNamesMap) {
    const oThis = this;

    if (shortToLongNamesMap) {
      return shortToLongNamesMap;
    } else {
      shortToLongNamesMap = basicHelper.invert(oThis.longToShortNamesMap);
      return shortToLongNamesMap;
    }
  }

  /**
   * Get set Mapping of short column names to their data types.
   *
   * @param {Object} shortNameToDataType: object's pointer provided by sub classes in which data would reside
   *
   * @returns {Object}
   */
  getSetShortNameToDataType(shortNameToDataType) {
    const oThis = this;

    if (shortNameToDataType) {
      return shortNameToDataType;
    } else {
      shortNameToDataType = oThis.defaultShortNameToDataType;
      const configFormatter = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'configFormatter'),
        extraStorageColumns = configFormatter.getExtraColumnConfigFor(oThis.tableIdentifier()),
        problematicShortNames = [];
      let longToShortNamesMap = oThis.longToShortNamesMap,
        columnShortName;
      for (let columnLongName in extraStorageColumns) {
        columnShortName = longToShortNamesMap[columnLongName];
        if (shortNameToDataType[columnShortName]) {
          problematicShortNames.push(columnLongName);
        } else {
          shortNameToDataType[columnShortName] = extraStorageColumns[columnLongName]['dataType'];
        }
      }
      if (problematicShortNames.length > 0) {
        throw `Conflicting Short Name ${problematicShortNames}`;
      }
      return shortNameToDataType;
    }
  }

  /**
   * Short name for a long table column name
   *
   * @param longName: long name of key
   *
   * @returns {String}
   */
  shortNameFor(longName) {
    const oThis = this;

    return oThis.longToShortNamesMap[longName];
  }

  /**
   * Long name for a short table column name
   *
   * @param shortName: short name of key
   *
   * @returns {String}
   */
  longNameFor(shortName) {
    const oThis = this;

    return oThis.shortToLongNamesMap[shortName];
  }

  /**
   * Get Table name.
   *
   * @returns {String}
   */
  tableName() {
    throw 'sub class to implement';
  }

  /**
   * Create table params
   *
   * @returns {Object}
   */
  tableSchema() {
    throw 'sub class to implement';
  }

  /**
   * Returns condition expression.
   *
   * @returns {String}
   */
  conditionExpression() {
    throw 'sub class to implement';
  }

  /**
   * Things to do after update
   *
   * @returns {Promise<void>}
   */
  afterUpdate() {
    throw 'sub class to implement';
  }

  /**
   * This function inserts an entry in the shards table.
   *
   * @param {Object} rowMap
   *
   * @returns {Promise<void>}
   */
  async putItem(rowMap) {
    const oThis = this;

    let formattedData = {
      Item: oThis._formatDataForDynamo(rowMap),
      TableName: oThis.tableName(),
      ConditionExpression: oThis.conditionExpression()
    };

    let putItemResponse = await oThis.ddbServiceObj.putItem(formattedData);

    if (putItemResponse.isFailure()) {
      logger.error('Could not create entry in shards table.');
      return Promise.resolve(putItemResponse);
    }

    await oThis.afterUpdate(rowMap);

    return Promise.resolve(putItemResponse);
  }

  /**
   * NOTE: This would override the existing document (if any) with the keys being passed
   * bulk create / update items in DDB
   *
   * @param {Array} rawData
   * @param {Integer} unprocessedItemsRetryCount: Retry count for unprocessed Items
   *
   * @returns {Promise<result>}
   */
  async batchWriteItem(rawData, unprocessedItemsRetryCount) {
    const oThis = this,
      batchWriteLimit = 25,
      parallelPromisesCount = 15;

    if (!unprocessedItemsRetryCount) {
      unprocessedItemsRetryCount = 0;
    }

    if (!oThis.tableName()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_m_b_1',
          api_error_identifier: 'invalidShardName',
          debug_options: {},
          error_config: errorConfig
        })
      );
    }

    let dataBatchNo = 1,
      formattedErrorCount = 1,
      allPromisesData = [];

    while (true) {
      const offset = (dataBatchNo - 1) * batchWriteLimit,
        batchedRawData = rawData.slice(offset, batchWriteLimit + offset),
        batchedFormattedData = [];

      for (let i = 0; i < batchedRawData.length; i++) {
        let rowData = batchedRawData[i];
        batchedFormattedData.push({
          PutRequest: {
            Item: oThis._formatDataForDynamo(rowData)
          }
        });
      }

      if (batchedRawData.length > 0) {
        let batchWriteParams = { RequestItems: {} };
        batchWriteParams.RequestItems[oThis.tableName()] = batchedFormattedData;

        allPromisesData.push(batchWriteParams);
      }

      if (
        allPromisesData.length === parallelPromisesCount ||
        (batchedRawData.length === 0 && allPromisesData.length > 0)
      ) {
        let batchedPromisesData = [];

        for (let i = 0; i < allPromisesData.length; i++) {
          // Retry count is set to 10 as of now
          batchedPromisesData.push(oThis.ddbServiceObj.batchWriteItem(allPromisesData[i], unprocessedItemsRetryCount));
        }

        let promiseResponses = await Promise.all(batchedPromisesData);

        for (let i = 0; i < promiseResponses.length; i++) {
          if (promiseResponses[i].isFailure()) {
            // Error for this entry
            return Promise.reject(promiseResponses[i]);
          } else {
            let unprocessedItems = promiseResponses[i].data.UnprocessedItems;

            if (Object.keys(unprocessedItems).length > 0) {
              logger.error(
                `error batchPutItem batch : ${formattedErrorCount} unprocessedItems : ${
                  unprocessedItems[oThis.tableName()].length
                }`
              );
              return Promise.reject(
                responseHelper.error({
                  internal_error_identifier: 'l_m_b_2',
                  api_error_identifier: 'ddbRequestFailed',
                  debug_options: {
                    unProcessedCount: unprocessedItems[oThis.tableName()].length,
                    unprocessedItems: unprocessedItems[oThis.tableName()]
                  },
                  error_config: errorConfig
                })
              );
            }
          }
          formattedErrorCount += 1;
        }

        // Empty the batch promise data
        allPromisesData = [];
      }

      dataBatchNo = dataBatchNo + 1;

      if (batchedRawData.length === 0) break;
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Delete data in batch.
   *
   * @param {Array} rawData
   * @param {Integer} unprocessedItemsRetryCount: Retry count for unprocessed Items
   *
   * @returns {Promise<result>}
   */
  async batchDeleteItem(rawData, unprocessedItemsRetryCount) {
    const oThis = this,
      batchWriteLimit = 25,
      parallelPromisesCount = 15;

    if (!unprocessedItemsRetryCount) {
      unprocessedItemsRetryCount = 10;
    }

    if (!oThis.tableName()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_m_b_1',
          api_error_identifier: 'invalidShardName',
          debug_options: {},
          error_config: errorConfig
        })
      );
    }

    let dataBatchNo = 1,
      formattedErrorCount = 1,
      allPromisesData = [];

    while (true) {
      const offset = (dataBatchNo - 1) * batchWriteLimit,
        batchedRawData = rawData.slice(offset, batchWriteLimit + offset),
        batchedFormattedData = [];

      for (let i = 0; i < batchedRawData.length; i++) {
        let rowData = batchedRawData[i];
        batchedFormattedData.push({
          DeleteRequest: {
            Key: oThis._formatDataForDynamo(rowData)
          }
        });
      }

      if (batchedRawData.length > 0) {
        let batchWriteParams = { RequestItems: {} };
        batchWriteParams.RequestItems[oThis.tableName()] = batchedFormattedData;

        allPromisesData.push(batchWriteParams);
      }

      if (
        allPromisesData.length === parallelPromisesCount ||
        (batchedRawData.length === 0 && allPromisesData.length > 0)
      ) {
        let batchedPromisesData = [];

        for (let i = 0; i < allPromisesData.length; i++) {
          // Retry count is set to 10 as of now
          logger.log('allPromisesData', allPromisesData[i]);
          batchedPromisesData.push(oThis.ddbServiceObj.batchWriteItem(allPromisesData[i], unprocessedItemsRetryCount));
        }

        let promiseResponses = await Promise.all(batchedPromisesData);

        for (let i = 0; i < promiseResponses.length; i++) {
          if (promiseResponses[i].isFailure()) {
            // Error for this entry
            return Promise.reject(promiseResponses[i]);
          } else {
            let unprocessedItems = promiseResponses[i].data.UnprocessedItems;

            if (Object.keys(unprocessedItems).length > 0) {
              logger.error(
                `error batchPutItem batch : ${formattedErrorCount} unprocessedItems : ${
                  unprocessedItems[oThis.tableName()].length
                }`
              );
              return Promise.reject(
                responseHelper.error({
                  internal_error_identifier: 'l_m_b_2',
                  api_error_identifier: 'ddbRequestFailed',
                  debug_options: {
                    unProcessedCount: unprocessedItems[oThis.tableName()].length
                  },
                  error_config: errorConfig
                })
              );
            }
          }
          formattedErrorCount += 1;
        }

        // Empty the batch promise data
        allPromisesData = [];
      }

      dataBatchNo = dataBatchNo + 1;

      if (batchedRawData.length === 0) break;
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * This function adds TableName and Key to updateParams
   *
   * @param {Object} data
   *
   * @returns {Promise<void>}
   */
  async updateItem(data) {
    const oThis = this;

    let formattedQuery = {};

    formattedQuery['ExpressionAttributeNames'] = {};
    formattedQuery['ExpressionAttributeValues'] = {};

    formattedQuery['Key'] = oThis._keyObj(data);
    formattedQuery['ReturnValues'] = 'NONE';
    formattedQuery['TableName'] = oThis.tableName();

    let keys = Object.keys(formattedQuery['Key']),
      formattedData = oThis._formatDataForDynamo(data);

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      delete formattedData[key];
    }

    let expressionArray = [],
      updateDataKeys = Object.keys(formattedData);

    for (let i = 0; i < updateDataKeys.length; i++) {
      let key = updateDataKeys[i];
      let attrName = '#ui' + i;
      let attrValue = ':ui' + i;

      formattedQuery['ExpressionAttributeNames'][attrName] = key.toString();
      formattedQuery['ExpressionAttributeValues'][attrValue] = formattedData[key];
      expressionArray.push(attrName + ' = ' + attrValue);
    }

    let expressionString = expressionArray.join(',');

    formattedQuery['UpdateExpression'] = 'SET ' + expressionString;

    await oThis.ddbServiceObj.updateItem(formattedQuery);

    await oThis.afterUpdate(data);
  }

  /**
   * This function formats data for dynamo.
   * NOTE: Only send keys which are to be inserted in DB. DO NOT send keys with null values.
   *
   * @param {Object} rowMap
   *
   * @returns {*}
   *
   * @private
   */
  _formatDataForDynamo(rowMap) {
    const oThis = this;
    let dynamoDataTypes = ['N', 'S', 'L', 'BOOL', 'M', 'B', 'SS', 'NS', 'BS'];

    let formattedRowData = oThis._keyObj(rowMap),
      keys = Object.keys(rowMap);

    for (let index = 0; index < keys.length; index++) {
      let key = keys[index],
        value = rowMap[key],
        valueKeys = typeof value === 'object' ? Object.keys(value) : [];

      if (value.length === 0) {
        continue;
      } // Skip if key's value is empty array

      // If shortName exists for the key, use that shortName or use the key directly.
      let shortName = oThis.shortNameFor(key) ? oThis.shortNameFor(key) : key;

      // Extract value for known key type
      let knownKeyValue = typeof rowMap[key] === 'object' ? JSON.stringify(rowMap[key]) : rowMap[key];
      knownKeyValue = ['N', 'S'].includes(oThis.shortNameToDataType[shortName]) ? rowMap[key].toString() : rowMap[key];

      // Add known key data type
      value = oThis.shortNameToDataType[shortName] ? { [oThis.shortNameToDataType[shortName]]: knownKeyValue } : value;

      if (oThis.shortNameToDataType[shortName]) {
        formattedRowData[shortName] = value;
        continue;
      } // Don't proceed if known key is handled

      // Unknown key, value - Object type with single key
      value =
        valueKeys.length === 1
          ? dynamoDataTypes.includes(valueKeys[0])
            ? value
            : { S: JSON.stringify(value) }
          : value;

      // Unknown key, value - empty object
      value = valueKeys.length === 0 ? { S: {} } : value;

      // Unknown key, value - multi key object
      value = valueKeys.length > 1 ? { S: JSON.stringify(value) } : value;

      // Unknown key, value - not an object
      value = typeof value !== 'object' ? { S: value.toString() } : value;

      formattedRowData[shortName] = value;
    }

    return formattedRowData;
  }

  /**
   * Custom formatting
   * @param dbRows
   * @private
   */
  _customFormatRowFromDynamoDb(dbRows, key1, key2) {
    const oThis = this,
      finalResponse = {};

    // Loop over response from DB.
    for (let i = 0; i < dbRows.length; i++) {
      // Loop over all the keys received in a row.
      let formattedRow = oThis._formatRowFromDynamo(dbRows[i]);

      finalResponse[formattedRow[key1] + '-' + formattedRow[key2]] = formattedRow;
    }

    return finalResponse;
  }

  /**
   * This method formats the responses for batchGet.
   *
   * @param {Array} dbRows: dbRows from dynamoDB
   * @param {String} primaryKey: key which is used to index the map elements
   *
   * @private
   */
  _formatRowsFromDynamo(dbRows, primaryKey) {
    const oThis = this,
      finalResponse = {};

    // Loop over response from DB.
    for (let i = 0; i < dbRows.length; i++) {
      // Loop over all the keys received in a row.
      let formattedRow = oThis._formatRowFromDynamo(dbRows[i]);

      finalResponse[formattedRow[primaryKey]] = formattedRow;
    }

    return finalResponse;
  }

  /**
   * This method formats DDB data.
   *
   * @param {Array} dbRow: dbRow from dynamoDB
   *
   * @returns {Object}
   *
   * @private
   */
  _formatRowFromDynamo(dbRow) {
    const oThis = this,
      formattedData = {},
      longKeys = Object.keys(oThis.longToShortNamesMap);

    let dataType, dataValue;

    for (let dbRowKey in dbRow) {
      if (oThis.shortToLongNamesMap[dbRowKey]) {
        dataType = oThis.shortNameToDataType[dbRowKey];
        dataValue = dbRow[dbRowKey][dataType];
        switch (dataType) {
          case 'L':
            let formattedSerializedList = [];
            for (let i = 0; i < dataValue.length; i++) {
              formattedSerializedList.push(oThis._formatRowFromDynamo(dataValue[i]));
            }
            break;
          case 'M':
            let formattedSerializedMap = {};
            for (let key in dataValue) {
              formattedSerializedMap[key] = oThis._formatRowFromDynamo(dataValue[key]);
            }
            break;
          default:
            if (oThis.propertiesToParse[oThis.shortToLongNamesMap[dbRowKey]]) {
              dataValue = JSON.parse(dataValue);
            }
            formattedData[oThis.shortToLongNamesMap[dbRowKey]] = dataValue;
        }
      } else {
        // As the data type is only one for an attribute, we fetch it dynamically.
        let buffer = Object.keys(dbRow[dbRowKey]);
        formattedData[dbRowKey] = dbRow[dbRowKey][buffer[0]];
      }
    }

    // Add default values of missing keys depending on their data types.
    for (let index = 0; index < longKeys.length; index++) {
      let key = longKeys[index];

      if (!formattedData[key]) {
        let shortNameForKey = oThis.longToShortNamesMap[key],
          shortNameDataType = oThis.shortNameToDataType[shortNameForKey];

        switch (shortNameDataType) {
          case 'S':
            formattedData[key] = '';
            break;
          case 'N':
            formattedData[key] = 0;
            break;
          case 'M':
            formattedData[key] = {};
            break;
          case 'L':
            formattedData[key] = [];
            break;
        }
      }
    }

    return formattedData;
  }

  /**
   * List of properties required to be JSON parsed in response.
   * Derived class should override it and list its properties here if needed.
   *
   * @returns {Object}
   */
  get propertiesToParse() {
    return {};
  }
}

module.exports = ModelBaseKlass;
