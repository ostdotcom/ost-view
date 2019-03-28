/*
 * GetAll - Service for getting all transfers paginated
 *
 */

const OSTBase = require('@ostdotcom/base'),
  InstanceComposer = OSTBase.InstanceComposer;

const rootPrefix = '../../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  base64Helper = require(rootPrefix + '/lib/Base64/helper'),
  tokenFormatter = require(rootPrefix + '/lib/formatter/entities/token'),
  tokenTransferFormatter = require(rootPrefix + '/lib/formatter/entities/tokenTransfer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

require(rootPrefix + '/lib/providers/blockScanner');

class GetAllTransfers {
  /**
   *
   * @param {Object} params
   * @param {String/Number} params.chainId - chain id of the transactionHash
   * @param {String} params.transactionHash - transaction hash for which transfers needed to be fetched
   * @param {String} [params.paginationIdentifier]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.transactionHash = params.transactionHash;
    oThis.paginationIdentifier = params.paginationIdentifier;

    oThis.txTransfers = {};
    oThis.contractAddresses = new Set();
  }

  /**
   * perform
   *
   * @return {Promise|*}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/transfer/GetAll.js');
      return responseHelper.error('a_s_t_ga_1', 'something_went_wrong', err);
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

    return oThis.getTransactionTransfers();
  }

  /**
   * validateAndSanitize
   *
   * @return {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.error('a_s_t_ga_2', 'chainId missing');
    }

    if (!CommonValidator.isTxHashValid(oThis.transactionHash)) {
      return responseHelper.error('a_s_t_ga_3', 'transactionHash missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * This function gives proper format of transaction transfer data.
   *
   * @returns {Promise<any>}
   */
  async getTransactionTransfers() {
    const oThis = this;

    const transactionTransferResponse = await oThis.getTransferDetails();
    oThis.txTransfers = transactionTransferResponse.tokenTransfers;

    let formattedData = await oThis._formatTransferIdentifiers();

    let economyResult = {};
    if (formattedData && formattedData.length > 0) {
      economyResult = await oThis.getEconomyDetails();
    }

    const result = {
      tokenTransfers: formattedData,
      nextPagePayload: transactionTransferResponse.nextPagePayload,
      economyMap: economyResult
    };

    return responseHelper.successWithData(result);
  }

  /**
   * getTransferDetails - get transfer details from block scanner
   *
   */
  async getTransferDetails() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      TransferGet = blockScanner.transfer.GetAll;

    const txGetTransfersRsp = await new TransferGet(oThis.chainId, [oThis.transactionHash]).perform();

    if (txGetTransfersRsp.isFailure() || !txGetTransfersRsp.data[oThis.transactionHash]) {
      return responseHelper.error('a_s_t_ga_4', 'Data Not found');
    }

    const txHashRes = txGetTransfersRsp.data[oThis.transactionHash];

    return {
      tokenTransfers: txHashRes
    };
  }

  /**
   * This function transforms the given array in a format which is required by getTransferDetails service.
   * Also this creates a timestampInfo hash which will be used to insert timestamp info in final response.
   *
   * @private
   *
   * @returns {Array} transformed hash
   */
  async _formatTransferIdentifiers() {
    const oThis = this;

    const transactionTransfers = [];

    for (let eventIndex in oThis.txTransfers) {
      let transferInfo = oThis.txTransfers[eventIndex];

      transferInfo['chainId'] = oThis.chainId;

      oThis.contractAddresses.add(transferInfo.contractAddress);

      const transfer = await tokenTransferFormatter.perform(transferInfo);

      transactionTransfers.push(transfer);
    }

    return transactionTransfers;
  }

  /**
   * getEconomyDetails
   *
   * @return {Promise<void>}
   */
  async getEconomyDetails() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      Economy = blockScanner.model.Economy,
      economy = new Economy({ consistentRead: false });

    let contractAddresses = Array.from(oThis.contractAddresses);

    let serviceParams = {
      [oThis.chainId]: contractAddresses
    };

    let economyDataRsp = await economy.multiGetEconomiesData(serviceParams);

    let economyData = economyDataRsp.data;

    for (let contentId in economyData) {
      let formattedEconomy = await tokenFormatter.perform(economyData[contentId]);
      economyData[contentId] = formattedEconomy;
    }

    return economyData;
  }
}

InstanceComposer.registerAsShadowableClass(GetAllTransfers, coreConstants.icNameSpace, 'GetAllTransfers');
