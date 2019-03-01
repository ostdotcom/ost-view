/*
 * GetContractDetails - Service for getting block details
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenFormatter = require(rootPrefix + '/lib/formatter/entities/token'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

class GetContractDetails {
  /**
   * constructor
   *
   * @param chainId - chain id of the transactionHash
   * @param contractAddress - contract address for which details needed to be fetched
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.contractAddresses = [params.contractAddress];
  }

  /**
   * perform
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
   * asyncPerform
   *
   * @return {Promise<*>}
   */
  async asyncPerform() {
    const oThis = this;

    let response = await oThis.validateAndSanitize();

    if (response.isFailure()) return response;

    return oThis.getContractDetails();
  }

  /**
   * validateAndSanitize
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
   * getContractDetails - get details from block scanner
   */
  async getContractDetails() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      ContractGet = blockScanner.contract.Get;

    let contractGet = new ContractGet(oThis.chainId, oThis.contractAddresses);

    let response = await contractGet.perform();

    let contractData = response.data[oThis.contractAddresses[0]];

    if (!contractData) {
      return responseHelper.error('s_c_gd_4', 'Data Not found');
    }

    let result = await tokenFormatter.perform(contractData);

    return responseHelper.successWithData(result);
  }
}

InstanceComposer.registerAsShadowableClass(GetContractDetails, coreConstants.icNameSpace, 'GetContractDetails');
