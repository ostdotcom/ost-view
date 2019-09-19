/*
 * GetBlockDetails - Service for getting block details
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  blockFormatter = require(rootPrefix + '/lib/formatter/entities/block'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');
class GetBlockDetails {
  /**
   * constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.blockNumbers = params.blockNumber ? [params.blockNumber] : [];
    oThis.chainId = params.chainId;
  }

  /**
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/block/GetDetails.js');
      return responseHelper.error('s_b_gd_1', 'something_went_wrong');
    });
  }

  /**
   *
   * @returns {Promise<*|result|Object<result>|Object<Result>>}
   */
  async asyncPerform() {
    const oThis = this;

    let validateAndSanitizeResponse = await oThis.validateAndSanitize();

    if (validateAndSanitizeResponse.isFailure()) {
      return validateAndSanitizeResponse;
    }

    let promiseArray = [];

    promiseArray.push(oThis.getBlockDetails());
    promiseArray.push(oThis.getBlockDetailsExtended());

    let responses = await Promise.all(promiseArray);

    let response = {};
    Object.assign(response, responses[0].data);
    Object.assign(response, responses[1].data);

    if (!response.chainId) {
      responseHelper.error('NOT_FOUND', 'Data not found');
    }

    let finalRsp = await blockFormatter.perform(response);

    return responseHelper.successWithData(finalRsp);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.paramValidationError('s_b_gd_2', ['chainId']);
    }

    // If block number is present? Then
    if (oThis.blockNumbers[0] && !CommonValidator.isVarInteger(oThis.blockNumbers[0])) {
      return responseHelper.paramValidationError('s_b_gd_3', ['blockNumber']);
    }

    return responseHelper.successWithData({});
  }

  /**
   * getBlockDetails
   *
   * @returns {Promise<*>}
   */
  async getBlockDetails() {
    const oThis = this;

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      blockGetService = blockScanner.block.Get;

    let blockGet = new blockGetService(oThis.chainId, oThis.blockNumbers),
      blockGetResponse = await blockGet.perform().catch(function(err) {
        logger.error('Error in block get service');
        return Promise.resolve(responseHelper.error('s_b_gd_4', 'something went wrong'));
      });

    if (blockGetResponse.isFailure()) {
      return Promise.resolve(responseHelper.error('s_b_gd_5', 'block details get service failed'));
    }

    let blockDetails = blockGetResponse.data[oThis.blockNumbers[0]];

    if (!blockDetails) {
      return responseHelper.error('s_b_gd_6', 'Data Not found');
    }

    return responseHelper.successWithData(blockDetails);
  }

  /**
   * getBlockDetailsExtended
   *
   * @return {Promise<*>}
   */
  async getBlockDetailsExtended() {
    const oThis = this;

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      blockGetExtendedService = blockScanner.block.GetExtended;

    let blockGetExtended = new blockGetExtendedService(oThis.chainId, oThis.blockNumbers),
      blockGetExtendedResponse = await blockGetExtended.perform().catch(function(err) {
        logger.error('Error in block get extended service');
        return Promise.resolve(responseHelper.error('s_b_gd_7', 'something went wrong'));
      });

    if (blockGetExtendedResponse.isFailure()) {
      return Promise.resolve(responseHelper.error('s_b_gd_8', 'block details extended get service failed'));
    }

    let blockDetailsExtended = blockGetExtendedResponse.data[oThis.blockNumbers[0]];

    if (!blockDetailsExtended) {
      return responseHelper.error('s_b_gd_9', 'Data Not found');
    }

    return responseHelper.successWithData(blockDetailsExtended);
  }
}

InstanceComposer.registerAsShadowableClass(GetBlockDetails, coreConstants.icNameSpace, 'GetBlockDetails');
