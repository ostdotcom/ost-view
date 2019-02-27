/*
 * GetLatestTransactions - Service for latest transactions across multiple chains
 *
 */

const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  base64Helper = require(rootPrefix + '/lib/Base64/helper'),
  handlebarHelper = require(rootPrefix + '/helpers/handlebarHelper'),
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  transactionFormatter = require(rootPrefix + '/lib/formatter/entities/transaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

const MAX_QUERIES = 2;

class GetLatestTransactions {
  /**
   * constructor
   *
   * @param params
   * @param [timeSlot] {String} - time slot from which data has to be fetched
   * @param [paginationIdentifier] - identifier for last returned key
   */
  constructor(params) {
    const oThis = this;

    oThis.timeSlot = params.timeSlot;
    oThis.paginationIdentifier = params.paginationIdentifier;
    oThis.paginationTime = params.paginationTime;

    oThis.chainIdToTransactionHashesMap = {};
    oThis.latestSortedTransactionHashes = [];
  }

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/home/GetLatestTransactions.js');
      return responseHelper.error('s_h_glt_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this;

    let validationResponse = await oThis.validateAndSanitize();

    if (validationResponse.isFailure()) return validationResponse;

    await oThis.getLatestTransactions();

    let results = await oThis.getTransactionDetails();

    let transactions = [];

    for (let i = 0; i < oThis.latestSortedTransactionHashes.length; i++) {
      let transactionInfo = results[oThis.latestSortedTransactionHashes[i]];
      // Can happen if block scanner is running in delay - considered acceptable
      if (Object.keys(transactionInfo).length == 0) {
        continue;
      }
      transactions.push(await transactionFormatter.perform(transactionInfo));
    }

    let response = {
      transactions: transactions
    };

    if (oThis.nextPagePayload) {
      response['nextPagePayload'] = oThis.nextPagePayload;
    }

    response['currencySymbol'] = handlebarHelper.ostCurrencySymbol(true);

    return responseHelper.successWithData(response);
  }

  /**
   * validateAndSanitize
   *
   * @return {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (oThis.timeSlot && !CommonValidator.isVarInteger(oThis.timeSlot)) {
      return responseHelper.error('s_h_glt_2', 'timeSlot missing');
    }

    if (oThis.paginationTime && !CommonValidator.isVarInteger(oThis.paginationTime)) {
      return responseHelper.error('s_h_glt_3', 'paginationTime missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * getLatestTransactions
   *
   * @return {Promise<void>}
   */
  async getLatestTransactions() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      ShardByTransaction = blockScanner.model.ShardByTransaction,
      shardByTransaction = new ShardByTransaction({ consistentRead: false }),
      timeSlotShortName = shardByTransaction.shortNameFor('timeSlot'),
      paginationTimestampShortName = shardByTransaction.shortNameFor('paginationTimestamp'),
      shortNameForTransactionHash = shardByTransaction.shortNameFor('transactionHash'),
      dataTypeForTransactionHash = shardByTransaction.shortNameToDataType[shortNameForTransactionHash],
      shortNameForChainId = shardByTransaction.shortNameFor('chainId'),
      dataTypeForChainId = shardByTransaction.shortNameToDataType[shortNameForChainId];

    let timeSlot = oThis.timeSlot ? oThis.timeSlot : oThis.currentTimeSlot();

    let paginationTime = oThis.paginationTime || Math.floor((Date.now() - 60 * 1000) / 1000) + 1,
      limit = coreConstants.DEFAULT_PAGE_SIZE;

    for (let queryCount = 0; queryCount < MAX_QUERIES; queryCount++) {
      timeSlot = queryCount > 0 ? oThis.previousTimeSlot(timeSlot) : timeSlot;

      let queryParams = {
        TableName: shardByTransaction.tableName(),
        IndexName: shardByTransaction.secondGlobalSecondaryIndexName(),
        Limit: limit,
        KeyConditionExpression: '#timeSlot = :timeSlot AND #pgstmp < :pgstmp',
        ExpressionAttributeNames: {
          '#timeSlot': timeSlotShortName,
          '#pgstmp': paginationTimestampShortName
        },
        ExpressionAttributeValues: {
          ':timeSlot': { [shardByTransaction.shortNameToDataType[timeSlotShortName]]: timeSlot.toString() },
          ':pgstmp': {
            [shardByTransaction.shortNameToDataType[paginationTimestampShortName]]: paginationTime.toString()
          }
        },
        ScanIndexForward: false
      };

      let decryptedLastEvaluatedKey = null;

      if (oThis.paginationIdentifier) {
        let decryptedLastEvaluatedKeyString = base64Helper.decode(oThis.paginationIdentifier);
        decryptedLastEvaluatedKey = JSON.parse(decryptedLastEvaluatedKeyString);
      }

      if (decryptedLastEvaluatedKey) {
        queryParams['ExclusiveStartKey'] = decryptedLastEvaluatedKey;
      }

      let response = await shardByTransaction.ddbServiceObj.query(queryParams),
        latestTransactions = response.data.Items;

      for (let index = 0; index < latestTransactions.length; index++) {
        let transactionHash = latestTransactions[index][shortNameForTransactionHash][dataTypeForTransactionHash],
          chainId = latestTransactions[index][shortNameForChainId][dataTypeForChainId];

        oThis.latestSortedTransactionHashes.push(transactionHash);

        oThis.chainIdToTransactionHashesMap[chainId]
          ? oThis.chainIdToTransactionHashesMap[chainId].push(transactionHash)
          : (oThis.chainIdToTransactionHashesMap[chainId] = [transactionHash]);
      }

      if (response.data.LastEvaluatedKey) {
        let encryptedLastEvaluatedKey = base64Helper.encode(JSON.stringify(response.data.LastEvaluatedKey));

        oThis.nextPagePayload = {
          timeSlot: timeSlot,
          paginationTime: paginationTime,
          paginationIdentifier: encryptedLastEvaluatedKey
        };
      } else {
        oThis.nextPagePayload = {};
        let nextTimeSlot = oThis.getNextTimeSlot(timeSlot);

        if (nextTimeSlot) {
          oThis.nextPagePayload['timeSlot'] = nextTimeSlot;
          oThis.nextPagePayload['paginationTime'] = paginationTime;
          return;
        }
      }

      // Break if you've got enough transactions
      if (oThis.latestSortedTransactionHashes.length == coreConstants.DEFAULT_PAGE_SIZE) {
        break;
      } else {
        // fetch only remaining records from next timeslot
        limit = limit - oThis.latestSortedTransactionHashes.length;
        oThis.paginationIdentifier = oThis.nextPagePayload.paginationIdentifier;
      }
    }
  }

  /**
   * getNextTimeSlot
   *
   * @param timeSlot
   * @return {*}
   */
  getNextTimeSlot(timeSlot) {
    const oThis = this;

    let probableNextTimeSlot = parseInt(timeSlot) + 24 * 60 * 60 * 1000;

    return probableNextTimeSlot >= oThis.currentTimeSlot() ? null : probableNextTimeSlot.toString();
  }

  /**
   * current time slot
   *
   * @returns {number}
   */
  currentTimeSlot() {
    let s = 60 * 60 * 24 * 1000, // number of milli seconds in a day
      d = Date.now();

    return d - (d % s);
  }

  /**
   * previousTimeSlot
   *
   * @param timeSlot
   * @return {*}
   */
  previousTimeSlot(timeSlot) {
    return parseInt(timeSlot) - 24 * 60 * 60 * 1000;
  }

  /**
   * getTransactionDetails - get details from block scanner
   */
  async getTransactionDetails() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      TransactionGet = blockScanner.transaction.Get;

    let result = {};

    let options = {
      consistentRead: false
    };

    for (let chainId in oThis.chainIdToTransactionHashesMap) {
      let transactionGet = new TransactionGet(chainId, oThis.chainIdToTransactionHashesMap[chainId], options);
      let response = await transactionGet.perform();

      Object.assign(result, response.data);
    }

    return result;
  }
}

InstanceComposer.registerAsShadowableClass(GetLatestTransactions, coreConstants.icNameSpace, 'GetLatestTransactions');
