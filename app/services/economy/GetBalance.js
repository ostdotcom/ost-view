/**
 * Module to get token holder balance.
 *
 * @module app/services/economy/GetBalance
 */

const OSTBase = require('@ostdotcom/base');

const rootPrefix = '../../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenHolderFormatter = require(rootPrefix + '/lib/formatter/entities/tokenHolder');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer.
require(rootPrefix + '/lib/providers/blockScanner');
require(rootPrefix + '/app/services/contract/GetDetails');

/**
 * Class to get token holder balance.
 *
 * @class GetTokenHolderBalance
 */
class GetTokenHolderBalance {
  /**
   * Constructor to get token holder balance.
   *
   * @param {object} params
   * @param {string/number} params.chainId: chain id of the deployed contract.
   * @param {string} params.address: address for which balance needs to be fetched.
   * @param {string} params.contractAddress: contract address for which details needed to be fetched.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.address = params.address;
    oThis.contractAddress = params.contractAddress;

    oThis.tokenHolderDetails = null;
    oThis.tokenDetails = null;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise|*}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(`${__filename}::perform::catch`);
      logger.error(err);
      if (responseHelper.isCustomResult(err)) {
        return err;
      }

      return responseHelper.error('s_e_gb_1', 'something_went_wrong', err);
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

    const promisesArray = [];
    promisesArray.push(oThis.getContractDetails(), oThis.getAddressBalance());
    await Promise.all(promisesArray);

    const serviceResponse = {
      tokenHolderDetails: oThis.tokenHolderDetails,
      tokenDetails: oThis.tokenDetails,
      baseCurrencies: oThis.tokenDetails.baseCurrencies
    };

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
      return responseHelper.error('s_e_gb_2', 'chainId missing');
    }

    if (!CommonValidator.isEthAddressValid(oThis.contractAddress)) {
      return responseHelper.error('s_e_gb_3', 'contractAddress missing');
    }

    if (!CommonValidator.isEthAddressValid(oThis.address)) {
      return responseHelper.error('s_e_gb_4', 'address missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * Get address balance.
   *
   * @sets oThis.tokenHolderDetails
   *
   * @returns {Promise<*>}
   */
  async getAddressBalance() {
    const oThis = this;

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      EconomyAddressGetBalanceService = blockScanner.address.GetBalance;

    const economyAddressGetBalance = new EconomyAddressGetBalanceService(oThis.chainId, oThis.contractAddress, [
        oThis.address
      ]),
      economyAddressGetBalanceRsp = await economyAddressGetBalance.perform();

    if (!economyAddressGetBalanceRsp.isSuccess() && !economyAddressGetBalanceRsp.data[oThis.address]) {
      return responseHelper.error('s_e_gb_5', 'Data not found.');
    }

    const economyAddressData = economyAddressGetBalanceRsp.data[oThis.address];
    economyAddressData.chainId = oThis.chainId;

    if (!economyAddressData) {
      return responseHelper.error('s_e_gb_6', 'Data not found.');
    }

    economyAddressData.contractAddress = oThis.contractAddress;

    oThis.tokenHolderDetails = await tokenHolderFormatter.perform(economyAddressData);
  }

  /**
   * Get contract details.
   *
   * @sets oThis.tokenDetails
   *
   * @returns {Promise<*>}
   */
  async getContractDetails() {
    const oThis = this;

    const ContractDetails = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GetContractDetails'),
      contractDataClass = new ContractDetails({ chainId: oThis.chainId, contractAddress: oThis.contractAddress });

    const contractDataDetails = await contractDataClass.perform();
    if (contractDataDetails.isFailure()) {
      return contractDataDetails;
    }

    oThis.tokenDetails = contractDataDetails.data;
  }
}

InstanceComposer.registerAsShadowableClass(GetTokenHolderBalance, coreConstants.icNameSpace, 'GetTokenHolderBalance');
