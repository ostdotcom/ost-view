/**
 * Module to get token details by token symbol.
 *
 * @module app/services/token/GetDetails
 */

const OSTBase = require('@ostdotcom/base');

const rootPrefix = '../../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  GetContractDetailsService = require(rootPrefix + '/app/services/contract/GetDetails'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer.
require(rootPrefix + '/lib/providers/blockScanner');
require(rootPrefix + '/lib/cacheMultiManagement/BaseCurrency');

/**
 * Class to get token details by token symbol.
 *
 * @class GetTokenDetailsBySymbol
 */
class GetTokenDetailsBySymbol {
  /**
   * Constructor to get token details by token symbol.
   *
   * @param {object} params
   * @param {string} params.tokenSymbol
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.tokenSymbol = params.tokenSymbol;

    oThis.chainId = null;
    oThis.contractAddress = null;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise|*}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/token/GetDetails.js');

      return responseHelper.error('s_t_gd_1', 'something_went_wrong', err);
    });
  }

  /**
   * Async perform.
   *
   * @return {Promise<*>}
   */
  async asyncPerform() {
    const oThis = this;

    const response = await oThis.validateAndSanitize();
    if (response.isFailure()) {
      return response;
    }

    const tokenDetailsResponse = await oThis.getTokenDetails();
    if (tokenDetailsResponse.isFailure()) {
      return tokenDetailsResponse;
    }

    return new GetContractDetailsService({ chainId: oThis.chainId, contractAddress: oThis.contractAddress }).perform();
  }

  /**
   * Validate and sanitize.
   *
   * @return {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isTokenNameValid(oThis.tokenSymbol)) {
      return responseHelper.error('s_t_gd_2', 'Token symbol missing.');
    }

    return responseHelper.successWithData({});
  }

  /**
   * Get token details.
   *
   * @sets oThis.chainId, oThis.contractAddress, oThis.baseCurrencyContractAddress
   *
   * @returns {Promise<result>}
   */
  async getTokenDetails() {
    const oThis = this;

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      EconomyService = blockScanner.model.Economy;

    const Economy = new EconomyService({ consistentRead: false }),
      economyRsp = await Economy.searchBySymbol(oThis.tokenSymbol);

    if (economyRsp.isSuccess() && economyRsp.data.length === 1) {
      const tokenDetails = economyRsp.data[0];

      oThis.chainId = tokenDetails.chainId;
      oThis.contractAddress = tokenDetails.contractAddress;

      return responseHelper.successWithData({});
    }

    return responseHelper.error('s_t_gd_3', 'Token data not found.');
  }
}

InstanceComposer.registerAsShadowableClass(
  GetTokenDetailsBySymbol,
  coreConstants.icNameSpace,
  'GetTokenDetailsBySymbol'
);
