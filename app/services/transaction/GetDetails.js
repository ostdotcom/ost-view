/*
 * GetTransactionDetails - Service for getting block details
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionFormatter = require(rootPrefix + '/lib/formatter/entities/transaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

class GetTransactionDetails {
  /**
   * constructor
   *
   * @param chainId - chain id of the transactionHash
   * @param transactionHash - transactionHash for which details to be fetched
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.transactionHashes = params.transactionHash ? [params.transactionHash] : [];
  }

  /**
   * perform
   *
   * @return {Promise|*}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/transaction/GetDetails.js');
      return responseHelper.error('s_t_gd_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<*>}
   */
  async asyncPerform() {
    const oThis = this;

    let response = await oThis.validateAndSanitize();

    if (response.isFailure()) return response;

    let result = {};

    let transaction = await oThis.getTransactionDetails();

    if (!transaction) {
      return responseHelper.error('s_t_gd_2', 'Data Not found');
    }

    const pricePointsRsp = await oThis.getLatestPricePoints();

    if (pricePointsRsp.isFailure()) {
      return Promise.reject(pricePointsRsp);
    }

    const pricePointsRspData = pricePointsRsp.data;
    result['transaction'] = await transactionFormatter.perform(transaction);

    result['pricePoint'] = pricePointsRspData;

    return responseHelper.successWithData(result);
  }

  /**
   * validateAndSanitize
   *
   * @return {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.error('s_t_gd_3', 'chainId missing');
    }

    if (oThis.transactionHashes[0] && !CommonValidator.isTxHashValid(oThis.transactionHashes[0])) {
      return responseHelper.error('s_t_gd_4', 'transactionHash missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * getTransactionDetails - get details from block scanner
   */
  async getTransactionDetails() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      TransactionGet = blockScanner.transaction.Get,
      TransactionExtended = blockScanner.transaction.GetExtended;

    let transactionGet = new TransactionGet(oThis.chainId, oThis.transactionHashes);

    let response = await transactionGet.perform();

    let result = response.data[oThis.transactionHashes[0]];

    let transactionGetExtended = new TransactionExtended(oThis.chainId, oThis.transactionHashes);

    let transactionGetExtendedResponse = await transactionGetExtended.perform();

    let input = transactionGetExtendedResponse.data[oThis.transactionHashes[0]].input;

    if (input) {
      result['inputData'] = input;
    }

    return result;
  }

  /**
   * Get latest price points.
   *
   * @returns {Promise<Promise<Result>|*|Promise<Response>>}
   */
  async getLatestPricePoints() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance();

    const LatestPricePointsCache = blockScanner.cache.LatestPricePoint;

    return new LatestPricePointsCache().fetch();
  }
}

InstanceComposer.registerAsShadowableClass(GetTransactionDetails, coreConstants.icNameSpace, 'GetTransactionDetails');
