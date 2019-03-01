/*
 * GetAddressDetails - service to get address details
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenHolderFormatter = require(rootPrefix + '/lib/formatter/entities/tokenHolder'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

class GetTokenHolderBalance {
  /**
   * constructor
   *
   * @param chainId - chain id of the transactionHash
   * @param contractAddresses - contract addresses for which details needed to be fetched
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.address = params.address;
    oThis.contractAddress = params.contractAddress;
  }

  /**
   * perform
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
      } else {
        return responseHelper.error('s_e_gb_1', 'something_went_wrong', err);
      }
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

    return oThis.getAddressBalance();
  }

  /**
   * validateAndSanitize
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
   * GetContractDetails - get details from block scanner
   */
  async getAddressBalance() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      EconomyAddressGetBalance = blockScanner.address.GetBalance;

    let economyAddressGetBalance = new EconomyAddressGetBalance(oThis.chainId, oThis.contractAddress, [oThis.address]),
      economyAddressGetBalanceRsp = await economyAddressGetBalance.perform(),
      response = {};

    if (!economyAddressGetBalanceRsp.isSuccess() && !economyAddressGetBalanceRsp.data[oThis.address]) {
      return responseHelper.error('s_e_gb_5', 'Data Not found');
    }

    let economyAddressData = economyAddressGetBalanceRsp.data[oThis.address];
    economyAddressData['chainId'] = oThis.chainId;

    if (!economyAddressData) {
      return responseHelper.error('s_e_gb_6', 'Data Not found');
    }

    economyAddressData['contractAddress'] = oThis.contractAddress;

    let tokenHolderDetails = await tokenHolderFormatter.perform(economyAddressData);

    let contractData = await oThis.getContractDetails(oThis.contractAddress);

    response['tokenHolderDetails'] = tokenHolderDetails;
    response['tokenDetails'] = contractData.data;

    return responseHelper.successWithData(response);
  }

  async getContractDetails(contractAddress) {
    const oThis = this;

    let contractDetails = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GetContractDetails'),
      ContractDataClass = new contractDetails({ chainId: oThis.chainId, contractAddress: contractAddress }),
      contractDataDetails = await ContractDataClass.perform();

    return contractDataDetails;
  }
}

InstanceComposer.registerAsShadowableClass(GetTokenHolderBalance, coreConstants.icNameSpace, 'GetTokenHolderBalance');
