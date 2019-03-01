/*
 * GetBlockDetails - Service for getting block details
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

class GetTransferDetails {
  /**
   * constructor
   *
   * @param {Number} chainId - chain id of the transactionHash
   * @param {Array} transferIdentifiers - {txHash: [eventIndexes]}
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.transferIdentifiers = params.transferIdentifiers;
  }

  /**
   * perform
   *
   * @return {Promise|*}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/transfer/GetDetails.js');
      return responseHelper.error('s_tt_gd_1', 'something_went_wrong', err);
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

    return oThis.getTransferDetails();
  }

  /**
   * validateAndSanitize
   *
   * @return {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.error('s_tt_gd_2', 'chainId missing');
    }

    if (!oThis.transferIdentifiers) {
      return responseHelper.error('s_tt_gd_3', 'transferIdentifiers missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * getTransferDetails - get transfer details from block scanner
   *
   */
  async getTransferDetails() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      TransferGet = blockScanner.transfer.Get;

    let transferGet = new TransferGet(oThis.chainId, oThis.transferIdentifiers);

    let response = await transferGet.perform();

    return responseHelper.successWithData(response.data);
  }
}

InstanceComposer.registerAsShadowableClass(GetTransferDetails, coreConstants.icNameSpace, 'GetTransferDetails');
