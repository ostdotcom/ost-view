/**
 * Module to get token details by chain Id and contract address.
 *
 * @module app/services/contract/GetDetails
 */

const OSTBase = require('@ostdotcom/base');

const rootPrefix = '../../..',
  CommonValidator = require(rootPrefix + '/lib/validators/common'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenFormatter = require(rootPrefix + '/lib/formatter/entities/token');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer.
require(rootPrefix + '/lib/providers/blockScanner');
require(rootPrefix + '/lib/cacheMultiManagement/BaseCurrency');

/**
 * Class to get token details by chain Id and contract address.
 *
 * @class GetContractDetails
 */
class GetContractDetails {
  /**
   * Constructor to get token details by chain Id and contract address.
   *
   * @param {object} params
   * @param {string/number} params.chainId: chain id of the transactionHash
   * @param {string} params.contractAddress: contract address for which details needed to be fetched
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.contractAddresses = [params.contractAddress];

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
      logger.error(' In catch block of app/services/contract/GetDetails.js');

      return responseHelper.error('s_c_gd_1', 'something_went_wrong', err);
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

    await oThis.getContractDetails();

    await oThis.getBaseCurrencies();

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

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.error('s_c_gd_2', 'chainId missing');
    }

    if (oThis.contractAddresses[0] && !CommonValidator.isEthAddressValid(oThis.contractAddresses[0])) {
      return responseHelper.error('s_c_gd_3', 'contractAddress missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch contract details from block scanner.
   *
   * @sets oThis.contractDetails, oThis.baseCurrencyContractAddress
   *
   * @returns {Promise<void>}
   */
  async getContractDetails() {
    const oThis = this;

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      ContractGetService = blockScanner.contract.Get;

    const contractGet = new ContractGetService(oThis.chainId, oThis.contractAddresses);

    const response = await contractGet.perform();
    if (response.isFailure()) {
      return response;
    }

    const contractData = response.data[oThis.contractAddresses[0]];

    if (!contractData) {
      return responseHelper.error('s_c_gd_4', 'Data not found.');
    }

    oThis.contractDetails = await tokenFormatter.perform(contractData);
    oThis.baseCurrencyContractAddress = oThis.contractDetails.baseCurrencyContractAddress;
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
      return responseHelper.error('s_c_gd_5', 'Invalid Base Currency Address');
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

InstanceComposer.registerAsShadowableClass(GetContractDetails, coreConstants.icNameSpace, 'GetContractDetails');
