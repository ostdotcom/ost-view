/**
 * GetAddressTransactions: Service to get transactions for a given address
 *
 * @module app/services/address/GetAddressTransactions
 */

const OSTBase = require('@ostdotcom/base'),
  InstanceComposer = OSTBase.InstanceComposer;

const rootPrefix = '../../..',
  base64Helper = require(rootPrefix + '/lib/Base64/helper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  transactionFormatter = require(rootPrefix + '/lib/formatter/entities/transaction');

// Following require(s) for registering into instance composer
require(rootPrefix + '/lib/providers/blockScanner');

/**
 * Class for fetching transactions of an address.
 *
 * @class GetAddressTransactions
 */
class GetAddressTransactions {
  /**
   * Constructor for fetching transactions of an address.
   *
   * @param {Object} params
   * @param {String/Number} params.chainId: chain id of the transactionHash
   * @param {String} params.address: user address whose details need to be fetched
   * @param {String} [params.paginationIdentifier]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.address = params.address;
    oThis.paginationParams = params.paginationIdentifier;

    oThis.transactionHashes = [];
  }

  /**
   * Main performer of the class.
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
        return responseHelper.error('a_s_a_gat_1', 'something_went_wrong', err);
      }
    });
  }

  /**
   * Async performer
   *
   * @return {Promise<*>}
   */
  async asyncPerform() {
    const oThis = this;

    const response = await oThis.validateAndSanitize();

    if (response.isFailure()) return response;

    return oThis.getAddressTransactions();
  }

  /**
   * Validate and sanitize the input parameters.
   *
   * @return {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.error('s_a_gat_2', 'chainId missing');
    }

    if (!CommonValidator.isEthAddressValid(oThis.address)) {
      return responseHelper.error('s_a_gat_3', 'address missing');
    }

    return responseHelper.successWithData({});
  }

  /**
   * Get address transactions.
   *
   * @return {Promise}
   */
  async getAddressTransactions() {
    const oThis = this;

    let addressTransactionsRsp = await oThis._getTransactions();
    oThis.transactionHashes = addressTransactionsRsp.transactionHashes;

    const transactions = await oThis.getTransactionDetails();

    const formattedTransactions = await oThis._formatTransactions(transactions);

    const result = {
      transactions: formattedTransactions,
      nextPagePayload: addressTransactionsRsp.nextPagePayload
    };

    return responseHelper.successWithData(result);
  }

  /**
   * Get transactions.
   *
   * @return {*}
   *
   * @private
   */
  async _getTransactions() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      dummyAddress = '0x0',
      AddressGetTransaction = blockScanner.address.GetTransaction,
      options = { pageSize: coreConstants.DEFAULT_PAGE_SIZE };

    // Decrypt the pagination params.
    if (oThis.paginationParams) {
      options['nextPagePayload'] = JSON.parse(base64Helper.decode(oThis.paginationParams));
    }

    const addressGetTransaction = new AddressGetTransaction(oThis.chainId, oThis.address, dummyAddress, options),
      addressGetTransactionRsp = await addressGetTransaction.perform();

    if (!addressGetTransactionRsp.isSuccess() && !addressGetTransactionRsp.data.transactionHashes) {
      //NOTE: Don't send error. But instead send empty data
      //return responseHelper.error('s_a_gt_5', 'Data Not found');
    }

    let transactionHashes = addressGetTransactionRsp.data.transactionHashes || [];
    const response = {
      transactionHashes: transactionHashes,
      nextPagePayload: {}
    };

    if (
      addressGetTransactionRsp.data.nextPagePayload &&
      addressGetTransactionRsp.data.nextPagePayload.LastEvaluatedKey &&
      transactionHashes.length >= coreConstants.DEFAULT_PAGE_SIZE
    ) {
      //Encrypt next page payload
      response['nextPagePayload']['paginationIdentifier'] = base64Helper.encode(
        JSON.stringify(addressGetTransactionRsp.data.nextPagePayload)
      );
    }

    return response;
  }

  /**
   * Get transaction details.
   *
   * @return {Promise<*>}
   */
  async getTransactionDetails() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      TransactionGet = blockScanner.transaction.Get;

    let response = await new TransactionGet(oThis.chainId, oThis.transactionHashes).perform();

    return response.data;
  }

  /**
   * Format transaction hashes.
   *
   * @param {Object} transactionHashes
   *
   * @return {Array}
   *
   * @private
   */
  async _formatTransactions(transactionHashes) {
    const oThis = this,
      transactions = [];

    for (let index = 0; index < oThis.transactionHashes.length; index++) {
      const transactionHash = oThis.transactionHashes[index],
        transactionData = await transactionFormatter.perform(transactionHashes[transactionHash]);

      transactions.push(transactionData);
    }

    return transactions;
  }
}

InstanceComposer.registerAsShadowableClass(GetAddressTransactions, coreConstants.icNameSpace, 'GetAddressTransactions');
