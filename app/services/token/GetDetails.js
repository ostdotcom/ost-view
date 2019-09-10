/**
 * Module to get token details by token symbol.
 *
 * @module app/services/token/GetDetails
 */

const OSTBase = require('@ostdotcom/base');

const rootPrefix = '../../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenFormatter = require(rootPrefix + '/lib/formatter/entities/token');

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
    oThis.contractDetails = null;
    oThis.baseCurrencies = {};
    oThis.baseCurrencyContractAddress = null;
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

    const promisesArray = [];
    promisesArray.push(oThis.getContractDetails(), oThis.getBaseCurrencies());
    await Promise.all(promisesArray);

    const serviceResponse = oThis.contractDetails;
    serviceResponse.baseCurrencies = oThis.baseCurrencies;

    return responseHelper.successWithData(serviceResponse);
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
      oThis.baseCurrencyContractAddress = tokenDetails.baseCurrencyContractAddress;

      return responseHelper.successWithData({});
    }

    return responseHelper.error('s_t_gd_3', 'Token data not found.');
  }

  /**
   * Fetch contract details from block scanner.
   *
   * @sets oThis.contractDetails
   *
   * @returns {Promise<void>}
   */
  async getContractDetails() {
    const oThis = this;

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      ContractGetService = blockScanner.contract.Get;

    const response = await new ContractGetService(oThis.chainId, [oThis.contractAddress]).perform();
    if (response.isFailure()) {
      return response;
    }

    const contractData = response.data[oThis.contractAddress];
    if (!contractData) {
      return responseHelper.error('s_t_gd_4', 'Token data not found.');
    }

    oThis.contractDetails = await tokenFormatter.perform(contractData);
  }

  /**
   * Get base currencies details for contract addresses.
   *
   * @sets oThis.baseCurrencies
   *
   * @returns {Promise<*>}
   */
  async getBaseCurrencies() {
    const oThis = this;

    if (!CommonValidator.isEthAddressValid(oThis.baseCurrencyContractAddress)) {
      return responseHelper.error('s_t_gd_5', 'Invalid base currency address.');
    }

    const BaseCurrencyCache = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'BaseCurrencyCache'),
      baseCurrencyCacheObj = new BaseCurrencyCache({
        baseCurrencyContractAddresses: [oThis.baseCurrencyContractAddress]
      });

    const baseCurrencyCacheRsp = await baseCurrencyCacheObj.fetch();
    if (baseCurrencyCacheRsp.isSuccess()) {
      oThis.baseCurrencies = baseCurrencyCacheRsp.data;
    }
  }
}

InstanceComposer.registerAsShadowableClass(
  GetTokenDetailsBySymbol,
  coreConstants.icNameSpace,
  'GetTokenDetailsBySymbol'
);
