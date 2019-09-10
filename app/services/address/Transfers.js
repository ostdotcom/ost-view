/*
 * Transfers - service to get transfers of given address
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  base64Helper = require(rootPrefix + '/lib/Base64/helper'),
  tokenTransferFormatter = require(rootPrefix + '/lib/formatter/entities/tokenTransfer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

class GetAddressTransfers {
  /**
   *
   * @param {Object} params
   * @param {String/Number} params.chainId - chain id of the transactionHash
   * @param {String} params.address - user address whose details need to be fetched
   * @param {String} params.contractAddress - contract addresses for which details needed to be fetched
   * @param {String} [params.paginationIdentifier]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.address = params.address;
    oThis.contractAddress = params.contractAddress;
    oThis.paginationParams = params.paginationIdentifier;

    oThis.addressTransfers = [];
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
        return responseHelper.error('a_s_a_t_1', 'something_went_wrong', err);
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

    const response = await oThis.validateAndSanitize();

    if (response.isFailure()) return response;

    return oThis.getAddressTransfers();
  }

  /**
   * validateAndSanitize
   *
   * @return {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.error('a_s_a_t_2', 'chainId missing');
    }

    if (!CommonValidator.isEthAddressValid(oThis.contractAddress)) {
      return responseHelper.error('a_s_a_t_3', 'contractAddress missing');
    }

    if (!CommonValidator.isEthAddressValid(oThis.address)) {
      return responseHelper.error('a_s_a_t_4', 'address missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * This function gives proper format of address transfer data.
   *
   * @returns {Promise<any>}
   */
  async getAddressTransfers() {
    const oThis = this;

    const addressTransfersRsp = await oThis._getTransfers();
    oThis.addressTransfers = addressTransfersRsp.tokenTransfers;

    const transferIdentifiers = oThis._formatTransferIdentifiers();

    const formattedData = await oThis._getTransferDetails(transferIdentifiers);

    const finalResponse = {
      tokenTransfers: formattedData,
      nextPagePayload: addressTransfersRsp.nextPagePayload
    };

    return Promise.resolve(responseHelper.successWithData(finalResponse));
  }

  /**
   * GetContractDetails - get details from block scanner
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

    const addressGetTransfers = new addressGetTransfersService(
        oThis.chainId,
        oThis.address,
        oThis.contractAddress,
        options
      ),
      addressGetTransfersRsp = await addressGetTransfers.perform();

    if (!addressGetTransfersRsp.isSuccess() && !addressGetTransfersRsp.data.addressTransfers) {
      //NOTE: Don't send error. But instead send empty data
      //return responseHelper.error('a_s_a_t_5', 'Data Not found');
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
   * This function transforms the given array in a format which is required by getTransferDetails service.
   * Also this creates a timestampInfo hash which will be used to insert timestamp info in final response.
   *
   * @private
   * @returns {Hash} transformed hash
   */
  _formatTransferIdentifiers() {
    const oThis = this;

    const formattedHash = {};

    for (let index = 0; index < oThis.addressTransfers.length; index++) {
      let transferInfoHash = oThis.addressTransfers[index],
        txHash = transferInfoHash.transactionHash;

      formattedHash[txHash] = formattedHash[txHash] || [];
      formattedHash[txHash].push(transferInfoHash.eventIndex);
    }

    return formattedHash;
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

    const getTransferDetails = new getTransferDetailsService(oThis.chainId, transferIdentifiers),
      getTransferDetailsRsp = await getTransferDetails.perform();

    if (!getTransferDetailsRsp.isSuccess() && !getTransferDetailsRsp.data) {
      return responseHelper.error('a_s_a_t_6', 'Data Not found');
    }

    const formattedTransfers = await oThis._insertCustomValuesAndFormat(getTransferDetailsRsp.data);

    return formattedTransfers;
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

    for (let index = 0; index < oThis.addressTransfers.length; index++) {
      const addressTxTransfer = oThis.addressTransfers[index],
        transactionHash = addressTxTransfer.transactionHash,
        addressTxTransferIndex = addressTxTransfer.eventIndex,
        addressTxBlockTimestamp = addressTxTransfer.blockTimestamp;

      const transferEntity = ((responseHash[transactionHash] || {}).transfers || {})[String(addressTxTransferIndex)];

      //Parse next transfer entity.
      if (!transferEntity) {
        continue;
      }

      transferEntity.timeStamp = addressTxBlockTimestamp;
      transferEntity.chainId = oThis.chainId;

      transfers.push(await tokenTransferFormatter.perform(transferEntity));
    }

    return transfers;
  }
}

InstanceComposer.registerAsShadowableClass(GetAddressTransfers, coreConstants.icNameSpace, 'GetAddressTransfers');
