/*
 * GetAll - Service for getting all transfers paginated
 *
 */

const OSTBase = require('@ostdotcom/base'),
  InstanceComposer = OSTBase.InstanceComposer;

const rootPrefix = '../../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenFormatter = require(rootPrefix + '/lib/formatter/entities/token'),
  tokenTransferFormatter = require(rootPrefix + '/lib/formatter/entities/tokenTransfer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common');

require(rootPrefix + '/lib/providers/blockScanner');
require(rootPrefix + '/lib/cacheMultiManagement/BaseCurrency');

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
    oThis.baseCurrencyContractAddresses = [];
    oThis.tokenTransfers = {};
    oThis.nextPagePayload = null;
    oThis.economyMap = {};
    oThis.baseCurrencies = {};
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

    const response = await oThis.validateAndSanitize();

    if (response.isFailure()) {
      return response;
    }

    await oThis.getTransactionTransfers();

    await oThis.getBaseCurrencies();

    const result = {
      tokenTransfers: oThis.tokenTransfers,
      nextPagePayload: oThis.nextPagePayload,
      economyMap: oThis.economyMap,
      baseCurrencies: oThis.baseCurrencies
    };

    return responseHelper.successWithData(result);
  }

  /**
   * ValidateAndSanitize
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
    oThis.nextPagePayload = transactionTransferResponse.nextPagePayload;
    oThis.tokenTransfers = await oThis._formatTransferIdentifiers();

    if (oThis.tokenTransfers && oThis.tokenTransfers.length > 0) {
      oThis.economyMap = await oThis.getEconomyDetails();
    }
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

    for (const eventIndex in oThis.txTransfers) {
      const transferInfo = oThis.txTransfers[eventIndex];

      transferInfo.chainId = oThis.chainId;

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

    const contractAddresses = Array.from(oThis.contractAddresses);

    const serviceParams = {
      [oThis.chainId]: contractAddresses
    };

    const economyDataRsp = await economy.multiGetEconomiesData(serviceParams);

    const economyData = economyDataRsp.data;

    for (const contentId in economyData) {
      const formattedEconomy = await tokenFormatter.perform(economyData[contentId]);
      oThis.baseCurrencyContractAddresses.push(formattedEconomy.baseCurrencyContractAddress);
      economyData[contentId] = formattedEconomy;
    }

    return economyData;
  }

  /**
   * Get base currencies details for contract addresses
   *
   * @returns {Promise<void>}
   */
  async getBaseCurrencies() {
    const oThis = this;

    oThis.baseCurrencyContractAddresses = oThis.baseCurrencyContractAddresses.filter(Boolean);

    if (oThis.baseCurrencyContractAddresses.length === 0) {
      return;
    }

    const BaseCurrencyCache = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'BaseCurrencyCache'),
      baseCurrencyCacheObj = new BaseCurrencyCache({
        baseCurrencyContractAddresses: oThis.baseCurrencyContractAddresses
      });

    const baseCurrencyCacheRsp = await baseCurrencyCacheObj.fetch();

    if (baseCurrencyCacheRsp.isSuccess()) {
      oThis.baseCurrencies = baseCurrencyCacheRsp.data;
    }
  }
}

InstanceComposer.registerAsShadowableClass(GetAllTransfers, coreConstants.icNameSpace, 'GetAllTransfers');
