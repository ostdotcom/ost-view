/**
 * GetBlockTransactions: Service for getting block transactions
 *
 * @module app/services/block/Transactions
 */
const OSTBase = require('@ostdotcom/base'),
  InstanceComposer = OSTBase.InstanceComposer;

const rootPrefix = '../../..',
  base64Helper = require(rootPrefix + '/lib/Base64/helper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common'),
  transactionFormatter = require(rootPrefix + '/lib/formatter/entities/transaction');

// Following require(s) for registering into instance composer
require(rootPrefix + '/lib/providers/blockScanner');

/**
 * Class for fetching transactions of a block.
 *
 * @class BlockTransactions
 */
class BlockTransactions {
  /**
   * Constructor for fetching transactions of a block.
   *
   * @param {Object} params
   * @param {String/Number} params.chainId: chain id of the block number
   * @param {String/Number} params.blockNumber: block number whose details need to be fetched
   * @param {String} [params.paginationIdentifier]
   * @param {String} [params.pageSize]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.blockNumber = params.blockNumber;
    oThis.chainId = params.chainId;
    oThis.pageSize = params.pageSize ? params.pageSize : coreConstants.DEFAULT_PAGE_SIZE;
    oThis.paginationParams = params.paginationIdentifier;

    oThis.blockTransactions = [];
  }

  /**
   * Main performer of the class.
   *
   * @return {Promise}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/block/Transactions.js');
      return responseHelper.error('a_s_b_t_1', 'something_went_wrong');
    });
  }

  /**
   * Async performer.
   *
   * @returns {Promise<*>}
   */
  async asyncPerform() {
    const oThis = this;

    let validateAndSanitizeResponse = await oThis.validateAndSanitize();

    if (validateAndSanitizeResponse.isFailure()) {
      return validateAndSanitizeResponse;
    }

    return oThis.getBlockDetails();
  }

  /**
   * Validate and sanitize the input parameters.
   *
   * @returns {Promise<void>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.paramValidationError('a_s_b_t_2', ['chainId']);
    }

    if (!CommonValidator.isVarInteger(oThis.blockNumber)) {
      return responseHelper.paramValidationError('a_s_b_t_3', ['blockNumber']);
    }

    if (!CommonValidator.isVarInteger(oThis.pageSize)) {
      return responseHelper.paramValidationError('a_s_b_t_4', ['pageSize']);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Get block details.
   *
   * @returns {Promise<*>}
   */
  async getBlockDetails() {
    const oThis = this;

    const blockTransactionsResponse = await oThis.getBlockTransactions();
    oThis.blockTransactions = blockTransactionsResponse.transactionHashes;

    const transactions = await oThis._fetchTransactionDetails();

    const formattedTransactions = await oThis._formatTransactions(transactions);

    const finalResponse = {
      transactions: formattedTransactions,
      nextPagePayload: blockTransactionsResponse.nextPagePayload
    };

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Fetch block transactions.
   *
   * @return {Promise<*>}
   */
  async getBlockTransactions() {
    const oThis = this,
      optionalParams = { pageSize: oThis.pageSize };

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      blockGetTransactionsService = blockScanner.block.GetTransaction;

    // Decrypt the pagination params.
    if (oThis.paginationParams) {
      optionalParams['nextPagePayload'] = JSON.parse(base64Helper.decode(oThis.paginationParams));
    }

    let blockGetTransactions = new blockGetTransactionsService(oThis.chainId, oThis.blockNumber, optionalParams),
      blockGetTransactionsResponse = await blockGetTransactions.perform().catch(function(err) {
        logger.error('Error in block get transactions service');
        return Promise.resolve(responseHelper.error('a_s_b_t_2', 'something_went_wrong'));
      });

    if (blockGetTransactionsResponse.isFailure()) {
      logger.error('Error in block get transaction service');
      return Promise.resolve(blockGetTransactionsResponse);
    }

    const response = {
      transactionHashes: blockGetTransactionsResponse.data.transactionHashes,
      nextPagePayload: {}
    };

    if (blockGetTransactionsResponse.data.nextPagePayload.LastEvaluatedKey) {
      //Encrypt next page payload
      response['nextPagePayload']['paginationIdentifier'] = base64Helper.encode(
        JSON.stringify(blockGetTransactionsResponse.data.nextPagePayload)
      );
    }

    return response;
  }

  /**
   * Fetch transaction details.
   *
   * @returns {Promise<any>}
   *
   * @private
   */
  async _fetchTransactionDetails() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      getTransactionDetailsService = blockScanner.transaction.Get;

    let getTransactionResponse = await new getTransactionDetailsService(
      oThis.chainId,
      oThis.blockTransactions
    ).perform();

    return getTransactionResponse.data;
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

    for (let index = 0; index < oThis.blockTransactions.length; index++) {
      const transactionHash = oThis.blockTransactions[index],
        transactionData = await transactionFormatter.perform(transactionHashes[transactionHash]);

      transactions.push(transactionData);
    }

    return transactions;
  }
}

InstanceComposer.registerAsShadowableClass(BlockTransactions, coreConstants.icNameSpace, 'BlockTransactions');
