/*
 * GetContractTransfers - Service for getting contract transfers
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  base64Helper = require(rootPrefix + '/lib/Base64/helper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenTransferFormatter = require(rootPrefix + '/lib/formatter/entities/tokenTransfer'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

class GetEconomyTransfers {
  /**
   *
   * @param {Object} params
   * @param {String/Number} params.chainId - chain id of the transactionHash
   * @param {String} params.contractAddress - contract addresses for which details needed to be fetched
   * @param {String} [params.paginationIdentifier]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.contractAddress = params.contractAddress;
    oThis.paginationParams = params.paginationIdentifier;

    oThis.economyTransfers = [];
  }

  /**
   * perform
   *
   * @return {Promise|*}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/economy/GetTransfers.js');
      return responseHelper.error('a_s_e_gt_1', 'something_went_wrong', err);
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

    return oThis.getEconomyTransfers();
  }

  /**
   * validateAndSanitize
   *
   * @return {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.error('a_s_e_gt_2', 'chainId missing');
    }

    if (!CommonValidator.isEthAddressValid(oThis.contractAddress)) {
      return responseHelper.error('a_s_e_gt_3', 'contractAddress missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * This function gives proper format of economy transfer data.
   *
   * @returns {Promise<any>}
   */
  async getEconomyTransfers() {
    const oThis = this;

    let addressTransfersRsp = await oThis._getTransfers();
    oThis.economyTransfers = addressTransfersRsp.tokenTransfers;

    let transferIdentifiers = oThis._formatTransferIdentifiers();

    let formattedData = await oThis._getTransferDetails(transferIdentifiers);

    let finalResponse = {
      tokenTransfers: formattedData,
      nextPagePayload: addressTransfersRsp.nextPagePayload
    };

    return Promise.resolve(responseHelper.successWithData(finalResponse));
  }

  /**
   * This function fetch list of transfers associated with the given economy address.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getTransfers() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      addressGetTransfersService = blockScanner.address.GetTransfer,
      options = { pageSize: coreConstants.DEFAULT_PAGE_SIZE };

    //decrypt the pagination params
    if (oThis.paginationParams) {
      options['nextPagePayload'] = JSON.parse(base64Helper.decode(oThis.paginationParams));
    }

    let addressGetTransfers = new addressGetTransfersService(
        oThis.chainId,
        oThis.contractAddress,
        oThis.contractAddress,
        options
      ),
      addressGetTransfersRsp = await addressGetTransfers.perform();

    if (!addressGetTransfersRsp.isSuccess() && !addressGetTransfersRsp.data.addressTransfers) {
      //NOTE: Don't send error. But instead send empty data
      //return responseHelper.error('a_s_e_gt_4', 'Data Not found');
    }

    let addressTransfers = addressGetTransfersRsp.data.addressTransfers || [];

    const response = {
      tokenTransfers: addressTransfers,
      nextPagePayload: {}
    };

    if (
      addressGetTransfersRsp.data.nextPagePayload &&
      addressGetTransfersRsp.data.nextPagePayload.LastEvaluatedKey &&
      addressTransfers.length >= coreConstants.DEFAULT_PAGE_SIZE
    ) {
      //Encrypt next page payload
      response['nextPagePayload']['paginationIdentifier'] = base64Helper.encode(
        JSON.stringify(addressGetTransfersRsp.data.nextPagePayload)
      );
    }

    return response;
  }

  /**
   * This function fetches transfer details.
   * Inserts timestamp in transfer details hash.
   * Formats data as expected by the service.
   *
   * @param {Array} transferIdentifiers
   *
   * @returns {Promise<*>} formatted data as required by the service
   *
   * @private
   */
  async _getTransferDetails(transferIdentifiers) {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      getTransferDetailsService = blockScanner.transfer.Get;

    let getTransferDetails = new getTransferDetailsService(oThis.chainId, transferIdentifiers),
      getTransferDetailsRsp = await getTransferDetails.perform();

    if (!getTransferDetailsRsp.isSuccess() && !getTransferDetailsRsp.data) {
      return responseHelper.error('a_s_e_gt_5', 'Data Not found');
    }

    let formattedTransfers = await oThis._insertCustomValuesAndFormat(getTransferDetailsRsp.data);

    return formattedTransfers;
  }

  /**
   * This function transforms the given array in a format which is required by getTransferDetails service.
   * Also this creates a timestampInfo hash which will be used to insert timestamp info in final response.
   *
   * @private
   *
   * @returns {Hash} transformed hash
   */
  _formatTransferIdentifiers() {
    const oThis = this;

    let formattedHash = {};

    for (let index = 0; index < oThis.economyTransfers.length; index++) {
      let transferInfoHash = oThis.economyTransfers[index],
        txHash = transferInfoHash.transactionHash;

      formattedHash[txHash] = formattedHash[txHash] || [];
      formattedHash[txHash].push(transferInfoHash.eventIndex);
    }

    return formattedHash;
  }

  /**
   * This function is used to insert timestamp and chainId in final response hash.
   *
   * @param {Hash}responseHash
   *
   * @returns {Hash}
   *
   * @private
   */
  async _insertCustomValuesAndFormat(responseHash) {
    const oThis = this,
      transfers = [];

    for (let index = 0; index < oThis.economyTransfers.length; index++) {
      const economyTxTransfer = oThis.economyTransfers[index],
        transactionHash = economyTxTransfer.transactionHash,
        economyTxTransferIndex = economyTxTransfer.eventIndex,
        economyTxBlockTimestamp = economyTxTransfer.blockTimestamp;

      const transferEntity = ((responseHash[transactionHash] || {}).transfers || {})[String(economyTxTransferIndex)];

      //Parse next transfer entity.
      if (!transferEntity) {
        continue;
      }

      transferEntity.timeStamp = economyTxBlockTimestamp;
      transferEntity.chainId = oThis.chainId;

      transfers.push(await tokenTransferFormatter.perform(transferEntity));
    }

    return transfers;
  }
}

InstanceComposer.registerAsShadowableClass(GetEconomyTransfers, coreConstants.icNameSpace, 'GetEconomyTransfers');
